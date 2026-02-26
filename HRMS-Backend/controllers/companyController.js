const Company = require('../models/company');

const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

exports.createCompany = async (req, res) => {
  let company = null;

  try {
    console.log('createCompany - Request body:', req.body);

    const {
      name,
      abbreviation,
      employeeIdBase,
      defaultOfficeStartTime = '09:00',
      defaultOfficeEndTime = '18:00',
      gracePeriod = 0
    } = req.body;

    if (!name || !abbreviation || !employeeIdBase) {
      throw new Error('Company name, abbreviation, and employeeIdBase are required');
    }

    if (await Company.findOne({ name })) {
      throw new Error('Company name must be unique');
    }
    if (await Company.findOne({ abbreviation })) {
      throw new Error('Company abbreviation must be unique');
    }

    const buildPayload = () => {
      const payload = { name, abbreviation, employeeIdBase, isActive: req.body.isActive !== false };
      if (defaultOfficeStartTime && timePattern.test(defaultOfficeStartTime)) payload.defaultOfficeStartTime = defaultOfficeStartTime;
      if (defaultOfficeEndTime && timePattern.test(defaultOfficeEndTime)) payload.defaultOfficeEndTime = defaultOfficeEndTime;
      if (typeof gracePeriod === 'number' && gracePeriod >= 0) payload.gracePeriod = gracePeriod;
      return payload;
    };

    company = new Company(buildPayload());

    await company.save();
    console.log('createCompany - Saved company:', { _id: company._id, name: company.name, isActive: company.isActive });

    res.status(201).json({ success: true, data: company });
  } catch (error) {
    console.error('createCompany - Error:', error);
    if (company) {
      await Company.deleteOne({ _id: company._id });
      console.log('createCompany - Rolled back company:', company._id);
    }
    res.status(400).json({ success: false, error: error.message });
  } finally {
    console.log('createCompany - Execution completed');
  }
};

exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({});
    console.log('getCompanies - Retrieved companies:', companies.map(c => ({
      _id: c._id,
      name: c.name,
      isActive: c.isActive
    })));

    res.status(200).json({ success: true, data: companies });
  } catch (error) {
    console.error('getCompanies - Error:', error);
    res.status(400).json({ success: false, error: error.message });
  } finally {
    console.log('getCompanies - Execution completed');
  }
};

exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    console.error('getCompanyById - Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const { name, abbreviation, employeeIdBase, isActive, defaultOfficeStartTime, defaultOfficeEndTime, gracePeriod } = req.body;
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });

    if (name !== undefined && name !== company.name) {
      if (await Company.findOne({ name, _id: { $ne: company._id } })) {
        return res.status(400).json({ success: false, error: 'Company name already in use' });
      }
      company.name = name;
    }
    if (abbreviation !== undefined && abbreviation !== company.abbreviation) {
      if (await Company.findOne({ abbreviation, _id: { $ne: company._id } })) {
        return res.status(400).json({ success: false, error: 'Company abbreviation already in use' });
      }
      company.abbreviation = abbreviation;
    }
    if (employeeIdBase !== undefined) company.employeeIdBase = employeeIdBase;
    if (isActive !== undefined) company.isActive = isActive;
    if (defaultOfficeStartTime && timePattern.test(defaultOfficeStartTime)) company.defaultOfficeStartTime = defaultOfficeStartTime;
    if (defaultOfficeEndTime && timePattern.test(defaultOfficeEndTime)) company.defaultOfficeEndTime = defaultOfficeEndTime;
    if (typeof gracePeriod === 'number' && gracePeriod >= 0) company.gracePeriod = gracePeriod;

    await company.save();
    res.status(200).json({ success: true, data: company });
  } catch (error) {
    console.error('updateCompany - Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};