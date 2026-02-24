
const moment = require('moment-timezone');
const HolidayCalendar = require('../models/holidayCalendar');
const xlsx = require('xlsx');
const fs = require('fs').promises;
const path = require('path');

exports.setHolidaysForYear = async (req, res) => {
  const { year, holidays } = req.body;

  if (!year || !holidays) {
    return res.status(400).json({ success: false, error: 'Year and holidays are required.' });
  }

  try {
    // Super Admin: save as global (null) so holidays apply to all employees
    const targetCompanyId = req.user.role === 'Super Admin' ? null : req.user.companyId;
    let holidaysToSave = holidays.map(h => ({
      startDate: moment(h.startDate).startOf('day').toDate(),
      endDate: h.endDate ? moment(h.endDate).startOf('day').toDate() : moment(h.startDate).startOf('day').toDate(),
      name: h.name,
      type: h.type || 'national',
      applicableToAll: h.applicableToAll !== false
    }));
    // Non-Super Admin: exclude holidays that exist in global to avoid duplicating
    if (req.user.role !== 'Super Admin') {
      const globalCal = await HolidayCalendar.findOne({ companyId: null, year }).lean();
      const globalDates = new Set((globalCal?.holidays || []).map(h => moment(h.startDate).format('YYYY-MM-DD')));
      holidaysToSave = holidaysToSave.filter(h => !globalDates.has(moment(h.startDate).format('YYYY-MM-DD')));
    }
    const calendar = await HolidayCalendar.findOneAndUpdate(
      { companyId: targetCompanyId, year },
      { 
        companyId: targetCompanyId,
        year,
        holidays: holidaysToSave
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, data: calendar });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getHolidaysForYear = async (req, res) => {
  const { year = moment().year() } = req.query;
  try {
    // Super Admin sees global calendar; others see company + global merged
    let calendar;
    if (req.user.role === 'Super Admin') {
      calendar = await HolidayCalendar.findOne({ companyId: null, year });
    } else {
      const [companyCal, globalCal] = await Promise.all([
        HolidayCalendar.findOne({ companyId: req.user.companyId, year }).lean(),
        HolidayCalendar.findOne({ companyId: null, year }).lean()
      ]);
      const companyHolidays = companyCal?.holidays || [];
      const globalHolidays = globalCal?.holidays || [];
      const merged = [...companyHolidays, ...globalHolidays].sort(
        (a, b) => new Date(a.startDate) - new Date(b.startDate)
      );
      calendar = companyCal || globalCal ? { year: parseInt(year), holidays: merged } : null;
    }
    res.json({ success: true, data: calendar || { year: parseInt(year), holidays: [] } });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.uploadHolidayCalendar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded.' });
  }

  const filePath = req.file.path;
  let yearFromFileName;

  try {
    // Attempt to extract year from filename (e.g., "holidays_2024.xlsx")
    const fileName = req.file.originalname;
    const yearMatch = fileName.match(/(\d{4})/);
    if (yearMatch && yearMatch[1]) {
      yearFromFileName = parseInt(yearMatch[1], 10);
    }

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (!data.length) {
      return res.status(400).json({ success: false, error: 'Excel file is empty or has no data.' });
    }

    const holidaysToSave = [];
    let detectedYear = yearFromFileName || moment().year(); // Default to current year if not in filename

    for (const row of data) {
      const holidayDate = row['Date'];
      const holidayName = row['Name'];
      const holidayType = row['Type'] || 'national';
      const holidayEndDate = row['End Date']; // Optional

      if (!holidayDate || !holidayName) {
        console.warn('Skipping row due to missing Date or Name:', row);
        continue; // Skip rows with missing essential data
      }

      // Convert Excel date number to JS Date (Excel stores dates as numbers)
      let startDate;
      if (typeof holidayDate === 'number') {
        startDate = new Date(Math.round((holidayDate - 25569) * 86400 * 1000));
      } else {
        startDate = moment(holidayDate, ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD-MM-YYYY']).toDate();
      }

      // Validate startDate
      if (isNaN(startDate.getTime())) {
        console.warn('Skipping row due to invalid Date format:', row);
        continue;
      }
      
      // If year is not detected from filename, try to get it from the first valid date
      if (!yearFromFileName && detectedYear === moment().year()) {
        detectedYear = startDate.getFullYear();
      } else if (startDate.getFullYear() !== detectedYear) {
         // Optional: warn if dates span multiple years, or enforce single year per file
         console.warn(`Holiday for ${startDate.getFullYear()} found in file for year ${detectedYear}. Using ${detectedYear}.`);
      }

      let endDate = startDate;
      if (holidayEndDate) {
         if (typeof holidayEndDate === 'number') {
           endDate = new Date(Math.round((holidayEndDate - 25569) * 86400 * 1000));
         } else {
           endDate = moment(holidayEndDate, ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD-MM-YYYY']).toDate();
         }
         if (isNaN(endDate.getTime())) {
            endDate = startDate; // Fallback if end date is invalid
            console.warn('Invalid End Date format, defaulting to Start Date for row:', row);
         }
      }


      holidaysToSave.push({
        startDate: moment(startDate).startOf('day').toDate(),
        endDate: moment(endDate).startOf('day').toDate(),
        name: holidayName,
        type: holidayType,
        applicableToAll: true, // Assuming all imported holidays are applicable to all
      });
    }

    if (!holidaysToSave.length) {
      return res.status(400).json({ success: false, error: 'No valid holiday entries found in the Excel file.' });
    }

    // Super Admin: save as global (null) so holidays apply to all employees
    const targetCompanyId = req.user.role === 'Super Admin' ? null : req.user.companyId;
    const calendar = await HolidayCalendar.findOneAndUpdate(
      { companyId: targetCompanyId, year: detectedYear },
      { 
        companyId: targetCompanyId,
        year: detectedYear,
        holidays: holidaysToSave
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: `Holiday calendar for ${detectedYear} uploaded successfully.`, data: calendar });

  } catch (error) {
    console.error('uploadHolidayCalendar - Error:', error);
    res.status(500).json({ success: false, error: 'Failed to process Excel file: ' + error.message });
  } finally {
    // Clean up the uploaded file
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.error('Error deleting uploaded file:', err);
      }
    }
  }
};
