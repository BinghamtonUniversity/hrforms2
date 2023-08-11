// Form Configuration and Helper Functions
import React, { useContext } from "react";
import usePersonQueries from "../queries/person"
import useEmploymentQueries from "../queries/employment";
import { isValid } from "date-fns";

/** CONTEXT */
export const HRFormContext = React.createContext();
HRFormContext.displayName = 'HRFormContext';
export function useHRFormContext() { return useContext(HRFormContext); }

/** CONDITIONAL FIELDS */
export const conditionalFields = {
    partialLeave:['EF-LOA-PPEL','EF-LOA-PPS'],
    splitAssignment:['EF-PAY-ASCA']
};

/** TABS */
// Format constructed for react-checkbox-tree (see:https://www.npmjs.com/package/react-checkbox-tree)
const allTabs = [
    {value:'basic-info',label:'Basic Info'},
    {value:'person',label:'Person',children:[
        {value:'person-information',label:'Information'},
        {value:'person-demographics',label:'Demographics'},
        {value:'person-directory',label:'Directory'},
        {value:'person-education',label:'Education'},
        {value:'person-contacts',label:'Contacts'},
    ]},
    {value:'employment',label:'Employment',children:[
        {value:'employment-position',label:'Position'},
        {value:'employment-appointment',label:'Appointment'},
        {value:'employment-salary',label:'Salary'},
        {value:'employment-separation',label:'Separation'},
        {value:'employment-leave',label:'Leave'},
        {value:'employment-pay',label:'Pay'},
        {value:'employment-volunteer',label:'Volunteer'}
    ]},
    {value:'comments',label:'Comments'},
    {value:'review',label:'Review'}
];
export {allTabs}; //used on paytrans

/** Default Form Values */
const defaultFormActions = {
    PAYTRANS_ID:"",
    formCode:{FORM_CODE:"",FORM_TITLE:"",FORM_DESCRIPTION:""},
    actionCode:{ACTION_CODE:"",ACTION_TITLE:"",ACTION_DESCRIPTION:""},
    transactionCode:{TRANSACTION_CODE:"",TRANSACTION_TITLE:"",TRANSACTION_DESCRIPTION:""}
};
export {defaultFormActions}; //used on basic_info

const initFormValues = {
    formId:null,
    lookup:{
        type:"bNumber",
        values:{
            bNumber:"",
            lastName:"",
            dob:"",
        },
    },
    selectedRow:{},
    payroll:{},
    effDate:"",
    formActions:defaultFormActions,
    person: {
        information: {
            "HR_PERSON_ID":"",
            "SUNY_ID": "",
            "LOCAL_CAMPUS_ID": "",
            "SALUTATION_CODE":{"id": "","label": ""},
            "LEGAL_FIRST_NAME": "",
            "ALIAS_FIRST_NAME": "",
            "LEGAL_MIDDLE_NAME": "",
            "LEGAL_LAST_NAME": "",
            "SUFFIX_CODE": "",
            "VOLUNTEER_FIRE_FLAG": "",
            "REHIRE_RETIREE": "",
            "RETIREMENT_DATE": "",
            "RETIRED_FROM": "",
            "retiredDate":""
        },
        demographics: {
            "BIRTH_DATE": "",
            "US_CITIZEN_INDICATOR": "Y",
            "NON_CITIZEN_TYPE": {"id": "","label": ""},
            "EMP_AUTHORIZE_CARD_INDICATOR": "",
            "VISA_CODE": {"id": "","label": ""},
            "CITIZENSHIP_COUNTRY_CODE": {"id": "","label": ""},
            "GENDER": {"id": "","label": ""},
            "GENDER_IDENTITY":{"id": "","label":""},
            "HISPANIC_FLAG": "N",
            "ETHNICITY_MULT_CODES": "",
            "ETHNICITY_SOURCE_DSC": "",
            "DISABILITY_INDICATOR": "N",
            "MILITARY_STATUS_CODE": [],
            "VETERAN_INDICATOR": "N",
            "PROTECTED_VET_STATUS_CODE": [],
            "MILITARY_SEPARATION_DATE": "",
            "birthDate":"",
            "militarySepDate":""
        },
        directory: {
            address:[],
            phone:[],
            email:[]
        },
        education:{
            institutions:[]
        },
        contact:{
            contacts:[]
        }
    },
    employment: {
        position: {
            "LINE_ITEM_NUMBER": "",
            "APPOINTMENT_TYPE": {"id": "","label": ""},
            "APPOINTMENT_PERCENT": "",
            "BENEFIT_FLAG": {"id": "","label": ""},
            "APPOINTMENT_EFFECTIVE_DATE": "",
            "APPOINTMENT_END_DATE": "",
            "VOLUNTARY_REDUCTION": "",
            "PAYROLL_MAIL_DROP_ID": {"id": "","label": ""},
            "positionDetails": {},
            "apptEffDate": "",
            "apptEndDate": "",
            "justification": {"id": "","label": ""}
        },
        appointment: {
            "TERM_DURATION": "",
            "NOTICE_DATE": "",
            "CONTINUING_PERMANENCY_DATE": "",
            "TENURE_STATUS": {"id": "", "label": ""},
            "CAMPUS_TITLE": "",
            "SUPERVISOR_SUNY_ID": "",
            "SUPERVISOR_NAME": "",
            "REPORTING_DEPARTMENT_CODE": {"id": "", "label": ""},
            "DERIVED_FAC_TYPE": "N",
            "supervisor": [],
            "noticeDate": "",
            "contPermDate": "",
            "facultyDetails": {
                "fallCourses":{count:0,credits:0,list:""},
                "springCourses":{count:0,credits:0,list:""}
            },
            "studentDetails": {
                ACAD_HIST: "",
                INCOMPLETES: "0",
                MISSING_GRADES: "0",
                SGBSTDN_TERM_CODE_EFF: "",
                SHRLGPA_GPA: "",
                SMRPRLE_PROGRAM_DESC: "",
                SPRIDEN_ID: "",
                SPRIDEN_PIDM: "",
                STVCLAS_CODE: "",
                STVCLAS_DESC: "",
                STVMAJR_DESC: "",
                STVRESD_CODE: "",
                STVRESD_DESC: "",
                STVRESD_IN_STATE_DESC: "",
                STVRESD_IN_STATE_IND: "",
                STVTERM_DESC: "",
                "fall":{
                    "tuition":"",
                    "credits":"0"
                },
                "spring":{
                    "tuition":"",
                    "credits":"0"
                },
                "fellowship":"N",
                "fellowshipSource":{"id":"","label":""}
            }
        },
        salary:{
            "APPOINTMENT_PERCENT": "",
            "PAY_BASIS": "",
            "RATE_EFFECTIVE_DATE": "",
            "RATE_AMOUNT": "",
            "NUMBER_OF_PAYMENTS":"1",
            "SUNY_ACCOUNTS": [
                {
                    account:[{id:'',label:''}],
                    pct:'100'
                }
            ],
            "SUNY_ACCOUNTSSplit":false,
            "EXISTING_ADDITIONAL_SALARY": [],
            "ADDITIONAL_SALARY": [],
            "SPLIT_ASSIGNMENTS":[],
            "totalSalary": ""
        },
        separation: {
            lastDateWorked:""
        },
        leave: {
            SALARY_EFFECTIVE_DATE: "",
            CALCULATED_ANNUAL: "",
            leavePercent:0,
            leaveSalary:null,
            leaveEndDate:"",
            justification:{id:"",label:""},
            origSalary:"",
            salaryEffDate:""
        },
        pay: {
            existingPay:[],
            newPay:[]
        },
        volunteer: {
            subRole:{id:"",label:""},
            startDate:"",
            endDate:"",
            tenureStatus:{id:"",labe:""},
            hoursPerWeek:"",
            serviceType:{id:"",label:""},
            department:{id:"",label:""},
            univOfficial:[],
            supervisor: [],
            duties:""
        }
    },
    lastJournal:{
        STATUS:""
    },
    comment:""
};
export {initFormValues};

/** Helper Data Fetch Functions */
const {getPersonInfo} = usePersonQueries();
const {getEmploymentInfo} = useEmploymentQueries();

export function fetchFormData({watchIds,effectiveDate,payrollCode}) {
    const personinfo = getPersonInfo(watchIds[0],'information',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            const retiredDate = new Date(d?.RETIREMENT_DATE);
            d.retiredDate = isValid(retiredDate)?retiredDate:"";
        }
    });
    const persondemographics = getPersonInfo(watchIds[0],'demographics',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            const birthDate = new Date(d?.BIRTH_DATE);
            d.birthDate = isValid(birthDate)?birthDate:"";
            const milSepDate = new Date(d?.MILITARY_SEPARATION_DATE);
            d.milSepDate = isValid(milSepDate)?milSepDate:"";
        }
    });
    const persondirectory = getPersonInfo(watchIds[0],'directory',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            Object.keys(d).forEach(k => {
                d[k].forEach(v => {
                    if (v.hasOwnProperty('CREATE_DATE')) {
                        const dt = new Date(v.CREATE_DATE);
                        v.effDate = isValid(dt)?dt:"";
                        v.createDate = isValid(dt)?dt:"";
                    }
                });
            });
        }
    });
    const personeducation = getPersonInfo(watchIds[0],'education',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            d.forEach(o => {
                const awardDate = new Date(o.DEGREE_YEAR,(o.DEGREE_MONTH||1)-1);
                o.awardDate = isValid(awardDate)?awardDate:"";
                o.institutionName = [{id:o.INSTITUTION_ID,label:o.INSTITUTION}];
                o.institutionCity = [o.INSTITUTION_CITY];
                const createDate = new Date(o.CREATE_DATE);
                o.createDate = isValid(createDate)?createDate:"";
            });
        }
    });
    const personcontacts = getPersonInfo(watchIds[0],'contact',{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            d.forEach(o => {
                o.isPrimary = (o.EMR_CTC_RANK=='1')?'Y':'N';
                const createDate = new Date(o.CREATE_DATE);
                o.createDate = isValid(createDate)?createDate:"";
            });
        }
    });
    //Employment Info:
    const employmentappointment = getEmploymentInfo([watchIds[0],'appointment'],{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            const noticeDate = new Date(d?.NOTICE_DATE);
            d.noticeDate = isValid(noticeDate)?noticeDate:"";
            const contPermDate = new Date(d?.CONTINUING_PERMANENCY_DATE);
            d.contPermDate = isValid(contPermDate)?contPermDate:"";
        }
    });
    const studentinformation = getEmploymentInfo([watchIds[2],'studentinfo'],{
        refetchOnMount:false,
        enabled:false,
    });
    const employmentposition = getEmploymentInfo([watchIds[0],'position'],{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            const apptEffDate = new Date(d?.APPOINTMENT_EFFECTIVE_DATE);
            d.apptEffDate = isValid(apptEffDate)?apptEffDate:"";
            const apptEndDate = new Date(d?.APPOINTMENT_END_DATE);
            d.apptEndDate = isValid(apptEndDate)?apptEndDate:"";
        }
    });
    const employmentsalary = getEmploymentInfo([watchIds[0],'salary'],{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            const effDate = new Date(d?.RATE_EFFECTIVE_DATE);
            d.effDate = isValid(effDate)?effDate:effectiveDate;
            d.SUNY_ACCOUNTSSplit = d.SUNY_ACCOUNTS.length > 1;
            d.SPLIT_ASSIGNMENTS.map(a => {
                const commitmentEffDate = new Date(a?.COMMITMENT_EFFECTIVE_DATE);
                a.commitmentEffDate = isValid(commitmentEffDate)?commitmentEffDate:"";
                const commitmentEndDate = new Date(a?.COMMITMENT_END_DATE);
                a.commitmentEndDate = isValid(commitmentEndDate)?commitmentEndDate:"";
                const createDate = new Date(a?.CREATE_DATE);
                a.createDate = isValid(createDate)?createDate:"";
            });
            d.totalSalary = ((+d.RATE_AMOUNT*+d.NUMBER_OF_PAYMENTS) * (+d.APPOINTMENT_PERCENT/100)).toFixed(2);
            console.log(d);
        }
    });
    const employmentleave = getEmploymentInfo([watchIds[1],'leave',effectiveDate],{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            const origSalary = (!d?.CALCULATED_ANNUAL)?0:d.CALCULATED_ANNUAL
            d.origSalary = Number(origSalary.replace(/[^\d.]+/g,''));
            d.leaveSalary = d.origSalary;
            const salaryEffDate = new Date(d?.SALARY_EFFECTIVE_DATE);
            d.salaryEffDate = isValid(salaryEffDate)?salaryEffDate:"";
        }
    });
    const employmentpay = getEmploymentInfo([watchIds[1],'pay',payrollCode],{
        refetchOnMount:false,
        enabled:false,
        onSuccess:d=>{
            d.forEach(c => {
                const commitmentEffDate = new Date(c?.COMMITMENT_EFFECTIVE_DATE);
                c.commitmentEffDate = isValid(commitmentEffDate)?commitmentEffDate:"";
                const commitmentEndDate = new Date(c?.COMMITMENT_END_DATE);
                c.commitmentEndDate = isValid(commitmentEndDate)?commitmentEndDate:"";
                c.supervisorSortName = [c.SUPERVISOR_LEGAL_LAST_NAME,c.SUPERVISOR_FIRST_NAME].join(', ');
            });
        }
    });
    return {personinfo,persondemographics,persondirectory,personeducation,personcontacts,
    employmentposition,employmentappointment,employmentsalary,employmentpay,employmentleave,
    studentinformation};
}
