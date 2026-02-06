// General Application Configurations
import { formats } from "../blocks/components";
import { get } from "lodash";
import bracesIcon from "../../images/mdi--code-braces.png";
import functionIcon from "../../images/mdi--function-variant.png";
//import { createTheme } from "react-data-table-component";

// createTheme - see: https://deepwiki.com/jbetancur/react-data-table-component/5-styling-and-theming#theme-creation-api
// overrides in scss file to make use of SCSS variables and nesting capabilities

// Icons not used by the AppButton component formats
const additionalIcons = [
    'mdi:alert',
    'mdi:arrow-all',
    'mdi:arrow-right',
    'mdi:calendar-blank',
    'mdi:clipboard-account',
    'mdi:information',
    'mdi:information-variant',
    'mdi:newspaper',
    'mdi:playlist-plus',
    'mdi:printer',
    'mdi:run',
    'mdi:undo'
];
// Preload Icons
export const icons = Array.from(new Set([...Object.values(formats).map(f=>get(f,'preload',true)&&f.icon),...additionalIcons]));


// Function and configuration for Jodit Editor
const formatterFunctionsList = {
    "formatCurrency":"Format as USD Currency",
    "formatDate":"Format as Date as m/d/Y",
};

const mustacheVarsList = {
    FORM_ID:'Form ID',
    REQUEST_ID:'Request ID',
    MAILTO: 'Email addresses(s) to send to',
    MAILCC: 'Email addresses(s) to CC',
    REPLYTO: 'Email address to reply to',
    STATUS: 'The status code of the Form/Request',
    SEQ: 'The sequence number of the Form/Request',
    GROUPS: 'The groups associated with the Form/Request',
    GROUP_FROM: 'The group the Form/Request was sent from',
    GROUP_TO: 'The group the Form/Request was sent to',
    SUBMITTED_BY: 'The SUNY ID of the user who submitted the Form/Request',
    SUBMITTER_NAME: 'The full name of the user who submitted the Form/Request',
    SUBMITTER_EMAIL: 'The email address of the user who submitted the Form/Request',
    URL: 'The URL to access the Form/Request',
};

const reqVarsList = {
  "REQ:REQID": 274,
  "REQ:POSTYPE:ID": "C",
  "REQ:POSTYPE:TITLE": "Classified",
  "REQ:REQTYPE:ID": "PC",
  "REQ:REQTYPE:TITLE": "Position Change",
  "REQ:EFFDATE": "2025-11-21T05:00:00.000Z",
  "REQ:NEWFUNDING:ID": "",
  "REQ:NEWFUNDING:TITLE": "",
  "REQ:COMMITMENTID": "",
  "REQ:CURRENTEMPLOYEE:0:ID": "",
  "REQ:CURRENTEMPLOYEE:0:LABEL": "",
  "REQ:CANDIDATENAME": "Test",
  "REQ:BNUMBER": "",
  "REQ:JOBDESC": "",
  "REQ:LINENUMBER": "12345",
  "REQ:NEWLINE": false,
  "REQ:MULTILINES": "N",
  "REQ:NUMLINES": "",
  "REQ:MINSALARY": "5000",
  "REQ:MAXSALARY": "7000",
  "REQ:FTE": "100",
  "REQ:PAYBASIS:ID": "ANN",
  "REQ:PAYBASIS:TITLE": "Annual (12 Month)",
  "REQ:CURRENTGRADE": "2",
  "REQ:NEWGRADE": "2",
  "REQ:REQBUDGETTITLE:ID": "HEAD_JANITOR",
  "REQ:REQBUDGETTITLE:TITLE": "Head Janitor",
  "REQ:APPTSTATUS:ID": "TEMP",
  "REQ:APPTSTATUS:TITLE": "Temporary",
  "REQ:APPTDURATION": "1",
  "REQ:APPTPERIOD": "y",
  "REQ:TENTATIVEENDDATE": "2025-11-28T05:00:00.000Z",
  "REQ:EXPTYPE": "",
  "REQ:ORGNAME:ID": "842600",
  "REQ:ORGNAME:TITLE": "Athletics (1 100)",
  "REQ:SUNYACCOUNTSSPLIT": false,
  "REQ:SUNYACCOUNTS:0:ACCOUNT:0:ID": "9008760100",
  "REQ:SUNYACCOUNTS:0:ACCOUNT:0:LABEL": "9008760100 - LABOR",
  "REQ:SUNYACCOUNTS:0:PCT": "100",
  "REQ:COMMENT": "",
  "REQ:ACTION": "approve",
  "REQ:WORKFLOW_ID": "40",
  "REQ:GROUPS": "-99,54,87,52,53,54",
  "REQ:DRAFTREQID": "draft-51645-1764111339",
  "REQ:CREATEDBY:SUNYHR_SUNY_ID": "51645",
  "REQ:CREATEDBY:B_NUMBER": "B00073866",
  "REQ:CREATEDBY:LEGAL_LAST_NAME": "Geiger",
  "REQ:CREATEDBY:LEGAL_FIRST_NAME": "Scott",
  "REQ:CREATEDBY:LEGAL_MIDDLE_NAME": "T",
  "REQ:CREATEDBY:ALIAS_FIRST_NAME": null,
  "REQ:CREATEDBY:EMAIL_ADDRESS_WORK": "geigers@binghamton.edu",
  "REQ:CREATEDBY:TITLE_DESCRIPTION": "Assoc Dir Comp Srvs",
  "REQ:CREATEDBY:CAMPUS_TITLE": "Director of Enterprise Applications",
  "REQ:CREATEDBY:DERIVED_FAC_TYPE": "N",
  "REQ:CREATEDBY:CARD_AFFIL": "PR",
  "REQ:CREATEDBY:NEGOTIATING_UNIT": "08",
  "REQ:CREATEDBY:SALARY_GRADE": "NSSL6",
  "REQ:CREATEDBY:APPOINTMENT_TYPE": "TEMP",
  "REQ:CREATEDBY:APPOINTMENT_EFFECTIVE_DATE": "10-APR-25",
  "REQ:CREATEDBY:APPOINTMENT_END_DATE": "09-APR-26",
  "REQ:CREATEDBY:APPOINTMENT_PERCENT": "100",
  "REQ:CREATEDBY:CONTINUING_PERMANENCY_DATE": "10-APR-26",
  "REQ:CREATEDBY:REPORTING_DEPARTMENT_CODE": "851130",
  "REQ:CREATEDBY:REPORTING_DEPARTMENT_NAME": "3 313 Computing Svcs Admin",
  "REQ:CREATEDBY:SUPERVISOR_SUNY_ID": "534819",
  "REQ:CREATEDBY:SUPERVISOR_LAST_NAME": "Cortesi",
  "REQ:CREATEDBY:SUPERVISOR_FIRST_NAME": "Timothy",
  "REQ:CREATEDBY:RECENT_CAMPUS_DATE": "17-APR-97",
  "REQ:CREATEDBY:USER_GROUPS": "-1,0,54,55,56,76,77,78,88",
  "REQ:CREATEDBY:SUNY_ID": "51645",
  "REQ:CREATEDBY:REFRESH_DATE": "25-NOV-2025 10:17:13 AM",
  "REQ:CREATEDBY:CACHED_DATA": true,
  "REQ:CREATEDBY:USER_OPTIONS:NOTIFICATIONS": "Y",
  "REQ:CREATEDBY:USER_OPTIONS:VIEWER": "N",
  "REQ:CREATEDDATE": "25-NOV-2025 05:55:51 PM",
  "REQ:SUBMITTEDBY": "51645",
  "REQ:LASTJOURNAL:REQUEST_ID": "274",
  "REQ:LASTJOURNAL:CREATED_BY_SUNY_ID": "51645",
  "REQ:LASTJOURNAL:SUNY_ID": "78364",
  "REQ:LASTJOURNAL:JOURNAL_DATE": "25-NOV-2025 17:57:39",
  "REQ:LASTJOURNAL:STATUS": "PA",
  "REQ:LASTJOURNAL:HIERARCHY_ID": "105",
  "REQ:LASTJOURNAL:WORKFLOW_ID": "40",
  "REQ:LASTJOURNAL:SEQUENCE": "4",
  "REQ:LASTJOURNAL:GROUP_FROM": "52",
  "REQ:LASTJOURNAL:GROUP_FROM_NAME": "PR_DIFR_ACCTS",
  "REQ:LASTJOURNAL:GROUP_FROM_DESCRIPTION": "",
  "REQ:LASTJOURNAL:GROUP_TO": "53",
  "REQ:LASTJOURNAL:GROUP_TO_NAME": "PR_BUDGET",
  "REQ:LASTJOURNAL:GROUP_TO_DESCRIPTION": "",
  "REQ:LASTJOURNAL:LEGAL_FIRST_NAME": "Erin",
  "REQ:LASTJOURNAL:LEGAL_MIDDLE_NAME": "Marie",
  "REQ:LASTJOURNAL:LEGAL_LAST_NAME": "Moore",
  "REQ:LASTJOURNAL:ALIAS_FIRST_NAME": "",
};

const formVarsList = {
  "FORM:FORMID": "566",
  "FORM:LOOKUP:TYPE": "bNumber",
  "FORM:LOOKUP:VALUES:BNUMBER": "B00082358",
  "FORM:LOOKUP:VALUES:LASTNAME": "",
  "FORM:LOOKUP:VALUES:DOB": "",
  "FORM:SELECTEDROW:HR_PERSON_ID": "184719",
  "FORM:SELECTEDROW:LINE_ITEM_NUMBER": "15065",
  "FORM:SELECTEDROW:SUNY_ID": "172976",
  "FORM:SELECTEDROW:NYS_EMPLID": "N01744905",
  "FORM:SELECTEDROW:EMPLOYMENT_ROLE_TYPE": "STEMP",
  "FORM:SELECTEDROW:DATA_STATUS_EMP": "C",
  "FORM:SELECTEDROW:STATUS_TYPE": "A",
  "FORM:SELECTEDROW:APPOINTMENT_EFFECTIVE_DATE": "30-MAY-25",
  "FORM:SELECTEDROW:APPOINTMENT_END_DATE": "29-AUG-25",
  "FORM:SELECTEDROW:BIRTH_DATE": "15-SEP-1956",
  "FORM:SELECTEDROW:FIRST_NAME": "Steven",
  "FORM:SELECTEDROW:LEGAL_MIDDLE_NAME": "D",
  "FORM:SELECTEDROW:LEGAL_LAST_NAME": "Machlin",
  "FORM:SELECTEDROW:SUFFIX_CODE": "",
  "FORM:SELECTEDROW:LOCAL_CAMPUS_ID": "B00082358",
  "FORM:SELECTEDROW:PAYROLL_AGENCY_CODE": "28020",
  "FORM:SELECTEDROW:TITLE_DESCRIPTION": "Tech Asst CSL",
  "FORM:SELECTEDROW:DPT_CMP_DSC": "2 303 Anderson Cntr Performing Arts",
  "FORM:SELECTEDROW:NEGOTIATING_UNIT": "14",
  "FORM:SELECTEDROW:APPOINTMENT_TYPE": "TEMP",
  "FORM:SELECTEDROW:APPOINTMENT_PERCENT": "25",
  "FORM:SELECTEDROW:PAY_BASIS": "FEE",
  "FORM:SELECTEDROW:FULLNAME": "Steven D. Machlin",
  "FORM:SELECTEDROW:SORTNAME": "Machlin, Steven D.",
  "FORM:SELECTEDROW:BIRTHDATE": "1956-09-15T04:00:00.000Z",
  "FORM:SELECTEDROW:BIRTHDATEFMT": "09\/15\/1956",
  "FORM:SELECTEDROW:EFFECTIVEDATE": "2025-05-30T04:00:00.000Z",
  "FORM:SELECTEDROW:EFFECTIVEDATEFMT": "05\/30\/2025",
  "FORM:SELECTEDROW:ENDDATE": "2025-08-29T04:00:00.000Z",
  "FORM:SELECTEDROW:ENDDATEFMT": "08\/29\/2025",
  "FORM:SELECTEDROW:ID": "184719",
  "FORM:PAYROLL:PAYROLL_CODE": "28020",
  "FORM:PAYROLL:PAYROLL_TITLE": "28020 - Faculty\/Staff",
  "FORM:PAYROLL:ACTIVE": "1",
  "FORM:PAYROLL:ORDERBY": "1",
  "FORM:PAYROLL:PAYROLL_DESCRIPTION": null,
  "FORM:PAYROLL:ADDITIONAL_INFO:HASBENEFITS": true,
  "FORM:PAYROLL:ADDITIONAL_INFO:SHOWSTUDENTAWARDAMOUNT": false,
  "FORM:EFFDATE": "2025-05-11T04:00:00.000Z",
  "FORM:FORMACTIONS:PAYTRANS_ID": "98",
  "FORM:FORMACTIONS:FORMCODE:FORM_CODE": "EF",
  "FORM:FORMACTIONS:FORMCODE:FORM_TITLE": "Employment Form",
  "FORM:FORMACTIONS:FORMCODE:FORM_DESCRIPTION": "EF description",
  "FORM:FORMACTIONS:ACTIONCODE:ACTION_CODE": "PAY",
  "FORM:FORMACTIONS:ACTIONCODE:ACTION_TITLE": "Pay",
  "FORM:FORMACTIONS:ACTIONCODE:ACTION_DESCRIPTION": "",
  "FORM:FORMACTIONS:TRANSACTIONCODE:TRANSACTION_CODE": "FEE",
  "FORM:FORMACTIONS:TRANSACTIONCODE:TRANSACTION_TITLE": "FEE Payment",
  "FORM:FORMACTIONS:TRANSACTIONCODE:TRANSACTION_DESCRIPTION": "",
  "FORM:FORMACTIONS:TABS:0": "person-information",
  "FORM:FORMACTIONS:TABS:1": "employment-salary",
  "FORM:FORMACTIONS:ROUTE_BY": "S",
  "FORM:FORMACTIONS:PR_REQUIRED": false,
  "FORM:FORMACTIONS:PR_NUMBER": "",
  "FORM:PERSON:INFORMATION:HR_PERSON_ID": "184719",
  "FORM:PERSON:INFORMATION:SUNY_ID": "172976",
  "FORM:PERSON:INFORMATION:LOCAL_CAMPUS_ID": "B00082358",
  "FORM:PERSON:INFORMATION:SALUTATION_CODE:ID": "Mr",
  "FORM:PERSON:INFORMATION:SALUTATION_CODE:LABEL": "Mr",
  "FORM:PERSON:INFORMATION:LEGAL_FIRST_NAME": "Steven",
  "FORM:PERSON:INFORMATION:ALIAS_FIRST_NAME": "",
  "FORM:PERSON:INFORMATION:LEGAL_MIDDLE_NAME": "D",
  "FORM:PERSON:INFORMATION:LEGAL_LAST_NAME": "Machlin",
  "FORM:PERSON:INFORMATION:SUFFIX_CODE": "",
  "FORM:PERSON:INFORMATION:VOLUNTEER_FIRE_FLAG": "0",
  "FORM:PERSON:INFORMATION:REHIRE_RETIREE": "1",
  "FORM:PERSON:INFORMATION:RETIREMENT_DATE": "25-JUL-18",
  "FORM:PERSON:INFORMATION:RETIRED_FROM": "Binghamton University",
  "FORM:PERSON:INFORMATION:RETIREDDATE": "2018-07-25T04:00:00.000Z",
  "FORM:PERSON:DEMOGRAPHICS:BIRTH_DATE": "",
  "FORM:PERSON:DEMOGRAPHICS:GENDER:ID": "",
  "FORM:PERSON:DEMOGRAPHICS:GENDER:LABEL": "",
  "FORM:PERSON:DEMOGRAPHICS:GENDER_IDENTITY:ID": "",
  "FORM:PERSON:DEMOGRAPHICS:GENDER_IDENTITY:LABEL": "",
  "FORM:PERSON:DEMOGRAPHICS:HIGHEST_EDUCATION_LEVEL:ID": "",
  "FORM:PERSON:DEMOGRAPHICS:HIGHEST_EDUCATION_LEVEL:LABEL": "",
  "FORM:PERSON:DEMOGRAPHICS:US_CITIZEN_INDICATOR": "Y",
  "FORM:PERSON:DEMOGRAPHICS:NON_CITIZEN_TYPE:ID": "",
  "FORM:PERSON:DEMOGRAPHICS:NON_CITIZEN_TYPE:LABEL": "",
  "FORM:PERSON:DEMOGRAPHICS:EMP_AUTHORIZE_CARD_INDICATOR": "",
  "FORM:PERSON:DEMOGRAPHICS:VISA_CODE:ID": "",
  "FORM:PERSON:DEMOGRAPHICS:VISA_CODE:LABEL": "",
  "FORM:PERSON:DEMOGRAPHICS:CITIZENSHIP_COUNTRY_CODE:ID": "",
  "FORM:PERSON:DEMOGRAPHICS:CITIZENSHIP_COUNTRY_CODE:LABEL": "",
  "FORM:PERSON:DEMOGRAPHICS:HISPANIC_FLAG": "N",
  "FORM:PERSON:DEMOGRAPHICS:ETHNICITY_MULT_CODES": "",
  "FORM:PERSON:DEMOGRAPHICS:ETHNICITY_SOURCE_DSC": "",
  "FORM:PERSON:DEMOGRAPHICS:DISABILITY_INDICATOR": "N",
  "FORM:PERSON:DEMOGRAPHICS:VETERAN_INDICATOR": "N",
  "FORM:PERSON:DEMOGRAPHICS:MILITARY_SEPARATION_DATE": "",
  "FORM:PERSON:DEMOGRAPHICS:BIRTHDATE": "",
  "FORM:PERSON:DEMOGRAPHICS:MILITARYSEPDATE": "",
  "FORM:EMPLOYMENT:POSITION:LINE_ITEM_NUMBER": "15065",
  "FORM:EMPLOYMENT:POSITION:APPOINTMENT_TYPE:ID": "TEMP",
  "FORM:EMPLOYMENT:POSITION:APPOINTMENT_TYPE:LABEL": "Temporary",
  "FORM:EMPLOYMENT:POSITION:APPOINTMENT_PERCENT": "25",
  "FORM:EMPLOYMENT:POSITION:BENEFIT_FLAG:ID": "9",
  "FORM:EMPLOYMENT:POSITION:BENEFIT_FLAG:LABEL": "No Benefits",
  "FORM:EMPLOYMENT:POSITION:APPOINTMENT_EFFECTIVE_DATE": "30-MAY-25",
  "FORM:EMPLOYMENT:POSITION:APPOINTMENT_END_DATE": "29-AUG-25",
  "FORM:EMPLOYMENT:POSITION:VOLUNTARY_REDUCTION": "N",
  "FORM:EMPLOYMENT:POSITION:PAYROLL_MAIL_DROP_ID:ID": "ANDERSON CNTR",
  "FORM:EMPLOYMENT:POSITION:PAYROLL_MAIL_DROP_ID:LABEL": "ANDERSON CNTR",
  "FORM:EMPLOYMENT:POSITION:POSITIONDETAILS:POSITION_ID": "2221842",
  "FORM:EMPLOYMENT:POSITION:POSITIONDETAILS:LINE_NUMBER": "15065",
  "FORM:EMPLOYMENT:POSITION:POSITIONDETAILS:PAYROLL": "28020",
  "FORM:EMPLOYMENT:POSITION:POSITIONDETAILS:EFFECTIVE_DATE": "04-MAY-17",
  "FORM:EMPLOYMENT:POSITION:POSITIONDETAILS:SEGMENT_CODE": "TS",
  "FORM:EMPLOYMENT:POSITION:POSITIONDETAILS:TITLE": "Tech Asst CSL",
  "FORM:EMPLOYMENT:POSITION:POSITIONDETAILS:NEGOTIATING_UNIT": "14",
  "FORM:EMPLOYMENT:POSITION:POSITIONDETAILS:SALARY_GRADE": "NSSL1",
  "FORM:EMPLOYMENT:POSITION:POSITIONDETAILS:POSITION_PERCENT": "25",
  "FORM:EMPLOYMENT:POSITION:POSITIONDETAILS:PAY_BASIS": "FEE",
  "FORM:EMPLOYMENT:POSITION:POSITIONDETAILS:POSITION_DEPARTMENT_CODE": "832200",
  "FORM:EMPLOYMENT:POSITION:POSITIONDETAILS:POSITION_DEPARTMENT": "2 303 Anderson Cntr Performing Arts",
  "FORM:EMPLOYMENT:POSITION:POSITIONDETAILS:POSITION_STATUS": "C",
  "FORM:EMPLOYMENT:POSITION:APPTEFFDATE": "2025-05-30T04:00:00.000Z",
  "FORM:EMPLOYMENT:POSITION:APPTENDDATE": "2025-08-29T04:00:00.000Z",
  "FORM:EMPLOYMENT:POSITION:JUSTIFICATION:ID": "",
  "FORM:EMPLOYMENT:POSITION:JUSTIFICATION:LABEL": "",
  "FORM:EMPLOYMENT:POSITION:PAYROLL_AGENCY_CODE": "28020",
  "FORM:EMPLOYMENT:POSITION:HASBENEFITS": true,
  "FORM:EMPLOYMENT:APPOINTMENT:TERM_DURATION": "1",
  "FORM:EMPLOYMENT:APPOINTMENT:NOTICE_DATE": "",
  "FORM:EMPLOYMENT:APPOINTMENT:CONTINUING_PERMANENCY_DATE": "",
  "FORM:EMPLOYMENT:APPOINTMENT:TENURE_STATUS:ID": "",
  "FORM:EMPLOYMENT:APPOINTMENT:TENURE_STATUS:LABEL": "",
  "FORM:EMPLOYMENT:APPOINTMENT:CAMPUS_TITLE": "",
  "FORM:EMPLOYMENT:APPOINTMENT:SUPERVISOR_SUNY_ID": "",
  "FORM:EMPLOYMENT:APPOINTMENT:SUPERVISOR_NAME": "",
  "FORM:EMPLOYMENT:APPOINTMENT:REPORTING_DEPARTMENT_CODE:ID": "",
  "FORM:EMPLOYMENT:APPOINTMENT:REPORTING_DEPARTMENT_CODE:LABEL": "",
  "FORM:EMPLOYMENT:APPOINTMENT:DERIVED_FAC_TYPE": "N",
  "FORM:EMPLOYMENT:APPOINTMENT:ISADJUNCT": "N",
  "FORM:EMPLOYMENT:APPOINTMENT:SUPERVISOR:0:ID": "",
  "FORM:EMPLOYMENT:APPOINTMENT:SUPERVISOR:0:LABEL": "",
  "FORM:EMPLOYMENT:APPOINTMENT:NOTICEDATE": "",
  "FORM:EMPLOYMENT:APPOINTMENT:CONTPERMDATE": "",
  "FORM:EMPLOYMENT:APPOINTMENT:FACULTYDETAILS:FALLCOURSES:COUNT": 0,
  "FORM:EMPLOYMENT:APPOINTMENT:FACULTYDETAILS:FALLCOURSES:CREDITS": 0,
  "FORM:EMPLOYMENT:APPOINTMENT:FACULTYDETAILS:FALLCOURSES:LIST": "",
  "FORM:EMPLOYMENT:APPOINTMENT:FACULTYDETAILS:SPRINGCOURSES:COUNT": 0,
  "FORM:EMPLOYMENT:APPOINTMENT:FACULTYDETAILS:SPRINGCOURSES:CREDITS": 0,
  "FORM:EMPLOYMENT:APPOINTMENT:FACULTYDETAILS:SPRINGCOURSES:LIST": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:ACAD_HIST": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:INCOMPLETES": "0",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:MISSING_GRADES": "0",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:SGBSTDN_TERM_CODE_EFF": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:SHRLGPA_GPA": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:SMRPRLE_PROGRAM_DESC": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:SPRIDEN_ID": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:SPRIDEN_PIDM": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:STVCLAS_CODE": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:STVCLAS_DESC": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:STVMAJR_DESC": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:STVRESD_CODE": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:STVRESD_DESC": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:STVRESD_IN_STATE_DESC": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:STVRESD_IN_STATE_IND": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:STVTERM_DESC": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:FALL:TUITION": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:FALL:CREDITS": "0",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:SPRING:TUITION": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:SPRING:CREDITS": "0",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:FELLOWSHIP": "N",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:FELLOWSHIPSOURCE:ID": "",
  "FORM:EMPLOYMENT:APPOINTMENT:STUDENTDETAILS:FELLOWSHIPSOURCE:LABEL": "",
  "FORM:EMPLOYMENT:SALARY:APPOINTMENT_PERCENT": "25",
  "FORM:EMPLOYMENT:SALARY:PAY_BASIS": "FEE",
  "FORM:EMPLOYMENT:SALARY:RATE_EFFECTIVE_DATE": "",
  "FORM:EMPLOYMENT:SALARY:RATE_AMOUNT": "320",
  "FORM:EMPLOYMENT:SALARY:NUMBER_OF_PAYMENTS": "1",
  "FORM:EMPLOYMENT:SALARY:SUNY_ACCOUNTS:0:ACCOUNT:0:ID": "5901100000",
  "FORM:EMPLOYMENT:SALARY:SUNY_ACCOUNTS:0:ACCOUNT:0:LABEL": "5901100000 - ANDERSON CENTER",
  "FORM:EMPLOYMENT:SALARY:SUNY_ACCOUNTS:0:PCT": "100",
  "FORM:EMPLOYMENT:SALARY:SUNY_ACCOUNTSSPLIT": false,
  "FORM:EMPLOYMENT:SALARY:TOTALSALARY": "320.00",
  "FORM:EMPLOYMENT:SALARY:SUNY_ID": "172976",
  "FORM:EMPLOYMENT:SALARY:EFFDATE": "2025-05-11T04:00:00.000Z",
  "FORM:EMPLOYMENT:SALARY:RATEEFFDATE": "",
  "FORM:EMPLOYMENT:SEPARATION:LASTDATEWORKED": "",
  "FORM:EMPLOYMENT:LEAVE:SALARY_EFFECTIVE_DATE": "",
  "FORM:EMPLOYMENT:LEAVE:CALCULATED_ANNUAL": "",
  "FORM:EMPLOYMENT:LEAVE:LEAVEPERCENT": 0,
  "FORM:EMPLOYMENT:LEAVE:LEAVESALARY": null,
  "FORM:EMPLOYMENT:LEAVE:LEAVEENDDATE": "",
  "FORM:EMPLOYMENT:LEAVE:JUSTIFICATION:ID": "",
  "FORM:EMPLOYMENT:LEAVE:JUSTIFICATION:LABEL": "",
  "FORM:EMPLOYMENT:LEAVE:ORIGSALARY": "",
  "FORM:EMPLOYMENT:LEAVE:SALARYEFFDATE": "",
  "FORM:EMPLOYMENT:VOLUNTEER:SUBROLE:ID": "",
  "FORM:EMPLOYMENT:VOLUNTEER:SUBROLE:LABEL": "",
  "FORM:EMPLOYMENT:VOLUNTEER:STARTDATE": "",
  "FORM:EMPLOYMENT:VOLUNTEER:ENDDATE": "",
  "FORM:EMPLOYMENT:VOLUNTEER:TENURESTATUS:ID": "",
  "FORM:EMPLOYMENT:VOLUNTEER:TENURESTATUS:LABE": "",
  "FORM:EMPLOYMENT:VOLUNTEER:HOURSPERWEEK": "1",
  "FORM:EMPLOYMENT:VOLUNTEER:SERVICETYPE:ID": "",
  "FORM:EMPLOYMENT:VOLUNTEER:SERVICETYPE:LABEL": "",
  "FORM:EMPLOYMENT:VOLUNTEER:DEPARTMENT:ID": "",
  "FORM:EMPLOYMENT:VOLUNTEER:DEPARTMENT:LABEL": "",
  "FORM:EMPLOYMENT:VOLUNTEER:SUPERVISOR:0:ID": "",
  "FORM:EMPLOYMENT:VOLUNTEER:SUPERVISOR:0:LABEL": "",
  "FORM:EMPLOYMENT:VOLUNTEER:DUTIES": "",
  "FORM:LASTJOURNAL:FORM_ID": "566",
  "FORM:LASTJOURNAL:CREATED_BY_SUNY_ID": "9043",
  "FORM:LASTJOURNAL:SUNY_ID": "54405",
  "FORM:LASTJOURNAL:JOURNAL_DATE": "03-DEC-2025 14:20:23",
  "FORM:LASTJOURNAL:STATUS": "PF",
  "FORM:LASTJOURNAL:HIERARCHY_ID": "705",
  "FORM:LASTJOURNAL:WORKFLOW_ID": "83",
  "FORM:LASTJOURNAL:SEQUENCE": "2",
  "FORM:LASTJOURNAL:GROUP_FROM": "9",
  "FORM:LASTJOURNAL:GROUP_FROM_NAME": "2 303 Harpur",
  "FORM:LASTJOURNAL:GROUP_FROM_DESCRIPTION": "",
  "FORM:LASTJOURNAL:GROUP_TO": "0",
  "FORM:LASTJOURNAL:GROUP_TO_NAME": "Human Resources",
  "FORM:LASTJOURNAL:GROUP_TO_DESCRIPTION": "Human Resouces",
  "FORM:LASTJOURNAL:COMMENTS": "",
  "FORM:LASTJOURNAL:LEGAL_FIRST_NAME": "Sondra",
  "FORM:LASTJOURNAL:LEGAL_MIDDLE_NAME": "Theresa",
  "FORM:LASTJOURNAL:LEGAL_LAST_NAME": "Hilldale",
  "FORM:LASTJOURNAL:ALIAS_FIRST_NAME": "",
  "FORM:LASTJOURNAL:SUBMITTER_SUNY_ID": "9043",
  "FORM:COMMENT": "",
  "FORM:TABSVISITED:0": "basic-info",
  "FORM:TABSVISITED:1": "person-information",
  "FORM:TABSVISITED:2": "review",
  "FORM:TABSVISITED:3": "comments",
  "FORM:ACTION": "approve",
  "FORM:WORKFLOW_ID": "83",
  "FORM:GROUPS": "-99,9,0",
  "FORM:DRAFTFORMID": "draft-9043",
  "FORM:CREATEDBY:SUNYHR_SUNY_ID": "9043",
  "FORM:CREATEDBY:B_NUMBER": "B00087417",
  "FORM:CREATEDBY:LEGAL_LAST_NAME": "Wrighter",
  "FORM:CREATEDBY:LEGAL_FIRST_NAME": "Marnie",
  "FORM:CREATEDBY:LEGAL_MIDDLE_NAME": null,
  "FORM:CREATEDBY:ALIAS_FIRST_NAME": null,
  "FORM:CREATEDBY:EMAIL_ADDRESS_WORK": "wrighter@binghamton.edu",
  "FORM:CREATEDBY:TITLE_DESCRIPTION": "Senr Staff Assnt",
  "FORM:CREATEDBY:CAMPUS_TITLE": "Interim Director of the Anderson Center",
  "FORM:CREATEDBY:DERIVED_FAC_TYPE": "N",
  "FORM:CREATEDBY:CARD_AFFIL": "PR",
  "FORM:CREATEDBY:NEGOTIATING_UNIT": "08",
  "FORM:CREATEDBY:SALARY_GRADE": "NSSL3",
  "FORM:CREATEDBY:APPOINTMENT_TYPE": "TERM",
  "FORM:CREATEDBY:APPOINTMENT_EFFECTIVE_DATE": "15-NOV-24",
  "FORM:CREATEDBY:APPOINTMENT_END_DATE": "14-NOV-25",
  "FORM:CREATEDBY:APPOINTMENT_PERCENT": "100",
  "FORM:CREATEDBY:CONTINUING_PERMANENCY_DATE": "15-NOV-25",
  "FORM:CREATEDBY:REPORTING_DEPARTMENT_CODE": "832200",
  "FORM:CREATEDBY:REPORTING_DEPARTMENT_NAME": "2 303 Anderson Cntr Performing Arts",
  "FORM:CREATEDBY:SUPERVISOR_SUNY_ID": "160924",
  "FORM:CREATEDBY:SUPERVISOR_LAST_NAME": "Klin",
  "FORM:CREATEDBY:SUPERVISOR_FIRST_NAME": "Celia",
  "FORM:CREATEDBY:RECENT_CAMPUS_DATE": "01-AUG-05",
  "FORM:CREATEDBY:USER_GROUPS": null,
  "FORM:CREATEDBY:SUNY_ID": "9043",
  "FORM:CREATEDBY:REFRESH_DATE": "07-OCT-2025 09:46:05 AM",
  "FORM:CREATEDBY:CACHED_DATA": true,
  "FORM:CREATEDBY:USER_OPTIONS:NOTIFICATIONS": "Y",
  "FORM:CREATEDDATE": "07-OCT-2025 09:54:40 AM",
};
// Editor Configuration
export function editorConfig(...args) {
    if (args[0] == 'source') {
        return {
            className: 'template_editor',
            showXPathInStatusbar:false,
            sourceEditorNativeOptions: {
                theme: 'ace/theme/chrome',
                wrap: false
            },
            controls: {
                formatters: {
                    iconURL: functionIcon,
                    tooltip: "Apply formatter function",
                    list: Object.keys(formatterFunctionsList).sort().reduce((Obj,key) => {
                        Obj[key] = [key];
                        return Obj;
                    },{}),
                    childTemplate: (editor,key,value) => {
                        return `<span title="${value}">${key} - ${formatterFunctionsList[key]}</span>` ;
                    },
                    exec: (editor,_,{ control }) => {
                        let value = control.args && control.args[0]; 
                        if (!value) return false;
                        const selectedRange = editor.selection.range;
                        const selectedText = (selectedRange) ? selectedRange.toString() : '';
                        editor.s.insertHTML(`{{#${value}}}${selectedText}{{/${value}}}`);
                    }
                },
                mustacheVars: {
                    iconURL: bracesIcon,
                    tooltip: "Insert replacement variables",
                    popup: (editor,current,close) => {
                        const list = editor.create.fromHTML(`
                            <aside id="test-vars-list">
                                <input type="text" id="test-vars-filter" placeholder="Filter variables..." class="form-control mb-2" autocomplete="off"/>
                                <div class="list-group">
                                    <a href="#" class="list-group-item list-group-item-action px-3 py-2 disabled list-group-item-secondary" aria-disabled="true" data-key="">--GENERAL VARS--</a>
                                    ${Object.keys(mustacheVarsList).sort().map(key=>`
                                        <a href="#" class="list-group-item list-group-item-action px-3 py-2" data-key="${key}">${key} - ${mustacheVarsList[key]}</a>
                                    `).join('')}
                                    <a href="#" class="list-group-item list-group-item-action px-3 py-2 disabled list-group-item-secondary" aria-disabled="true" data-key="">--REQUEST VARS--</a>
                                    ${Object.keys(reqVarsList).sort().map(key=>`
                                        <a href="#" class="list-group-item list-group-item-action px-3 py-2" data-key="${key}">${key} = <var>${reqVarsList[key]}</var></a>
                                    `).join('')}
                                    <a href="#" class="list-group-item list-group-item-action px-3 py-2 disabled list-group-item-secondary" aria-disabled="true" data-key="">--FORM VARS--</a>
                                    ${Object.keys(formVarsList).sort().map(key=>`
                                        <a href="#" class="list-group-item list-group-item-action px-3 py-2" data-key="${key}">${key} = <var>${formVarsList[key]}</var></a>
                                    `).join('')}
                                </div>
                            </aside>
                        `);
                        editor.e.on(list.querySelector('#test-vars-filter'),'input',(e) => {
                            const filter = e.target.value.toLowerCase();
                            const items = list.querySelectorAll('.list-group-item');
                            items.forEach(item => {
                                const key = item.dataset.key.toLowerCase();
                                if (key.includes(filter)) {
                                    item.style.display = '';
                                } else {
                                    item.style.display = 'none';
                                }
                            });
                        });
                        editor.e.on(list,'click',(e) => {
                            e.preventDefault();
                            if (!e.target.classList.contains('list-group-item')) return;
                            const value = e.target.dataset.key;
                            editor.s.insertHTML(`{{${value}}}`);
                            close();
                        });
                        return list;
                    }
                },
            },
            enter:"br",
            buttons:['bold','italic','underline','strikethrough','eraser','|','superscript','subscript','|','ul','ol','|','indent','outdent','align','|','paragraph','font','fontsize','brush','|','copy','cut','paste','selectall','|','undo','redo','|','hr','link','table','symbol','formatters','mustacheVars','|','source','print','fullsize','|','about'],
            buttonsMD:["bold","italic","underline","|","ul","ol","|","indent","outdent","align","|","font","fontsize","brush","|","copy","cut","paste","|","undo","redo","|","link","|","dots"],
            buttonsSM:["bold","italic","|","ul","ol","|","indent","outdent","align","|","font","brush","|","copy","cut","paste","|","undo","redo","|","link","|","dots"],
            buttonsXS:["bold","italic","|","ul","ol","|","font","fontsize","align","|","copy","cut","paste","|","link","|","dots"],
            disablePlugins: "video,file,preview,print,drag-and-drop,drag-and-drop-element,iframe,media,image,image-processor,image-properties"
        };
    } else {
        return {
            showXPathInStatusbar:false,
            buttons:['bold','italic','underline','strikethrough','eraser','|','superscript','subscript','|','ul','ol','|','indent','outdent','align','|','paragraph','font','fontsize','brush','|','copy','cut','paste','selectall','|','undo','redo','|','hr','link','table','symbol','|','fullsize','|','about'],
            buttonsMD:["bold","italic","underline","|","ul","ol","|","indent","outdent","align","|","font","fontsize","brush","|","copy","cut","paste","|","undo","redo","|","link","|","dots"],
            buttonsSM:["bold","italic","|","ul","ol","|","indent","outdent","align","|","font","brush","|","copy","cut","paste","|","undo","redo","|","link","|","dots"],
            buttonsXS:["bold","italic","|","ul","ol","|","font","fontsize","align","|","copy","cut","paste","|","link","|","dots"],
            disablePlugins: "video,file,preview,print,drag-and-drop,drag-and-drop-element,iframe,media,image,image-processor,image-properties"
        };
    }
}

// DataTables Configuration
export const datatablesConfig = {
    paginationRowsPerPageOptions:[10,20,30,40,50,100],
    paginationComponentOptions:{
        selectAllRowsItem: true
    }
}
