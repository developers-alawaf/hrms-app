const mongoose = require('mongoose');
const { Schema } = mongoose;

const shiftManagementSchema = new Schema({
    recordType: {
        type: String,
        required: true,
        enum: ['ShiftDefinition', 'Roster', 'WFHRequest', 'OutsideWorkRequest']
    },
    // company: { type: Schema.Types.ObjectId, ref: 'Company', required: true }, // Commented out

    // Fields for ShiftDefinition
    shiftCode: { type: String },
    name: { type: String }, // Shift Name
    officeStartTime: { type: String },
    officeEndTime: { type: String },
    wfhStartTime: { type: String },
    wfhEndTime: { type: String },
    isFingerprintRequired: { type: Boolean },
    isApprovalRequired: { type: Boolean },
    isOffDay: { type: Boolean, default: false },

    // Fields for Roster
    employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
    date: { type: Date },
    shift: { type: Schema.Types.ObjectId, ref: 'ShiftManagement' }, // Simplified field
    month: { type: String }, // YYYY-MM

    // Fields for WFHRequest & OutsideWorkRequest
    requestStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    wfhShift: { type: Schema.Types.ObjectId, ref: 'ShiftManagement' }, // Reference to ShiftDefinition for WFH
    officeShift: { type: Schema.Types.ObjectId, ref: 'ShiftManagement' }, // Reference to ShiftDefinition for Outside Work
    outTime: { type: String },
    expectedReturnTime: { type: String },
    reason: { type: String },
    
}, { timestamps: true });

// shiftManagementSchema.index({ company: 1, shiftCode: 1 }, { unique: true, partialFilterExpression: { recordType: 'ShiftDefinition' } }); // Commented out


const ShiftManagement = mongoose.model('ShiftManagement', shiftManagementSchema);

module.exports = ShiftManagement;
