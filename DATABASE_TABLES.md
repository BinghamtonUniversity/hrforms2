# Database Tables Used by API Classes

This file documents database tables referenced by `dist/htdocs/api/classes` and the fields used by the API source. It is inferred from SQL statements in the PHP source code.

## Table of Contents

- [BUHR.BUHR_ADDITIONAL_SALARY_MV@BANNER.CC.BINGHAMTON.EDU](#buhrbuhr-additional-salary-mvbannerccbinghamtonedu)
- [BUHR.BUHR_COMMITMENT_MV@BANNER.CC.BINGHAMTON.EDU](#buhrbuhr-commitment-mvbannerccbinghamtonedu)
- [BUHR.BUHR_EMERGENCY_CONTACT_MV@BANNER.CC.BINGHAMTON.EDU](#buhrbuhr-emergency-contact-mvbannerccbinghamtonedu)
- [BUHR.BUHR_EMPL_STATUS_MV@BANNER.CC.BINGHAMTON.EDU](#buhrbuhr-empl-status-mvbannerccbinghamtonedu)
- [BUHR.BUHR_GENERAL_INFO_MV@BANNER.CC.BINGHAMTON.EDU](#buhrbuhr-general-info-mvbannerccbinghamtonedu)
- [BUHR.BUHR_PAYROLL_DIST_MV@BANNER.CC.BINGHAMTON.EDU](#buhrbuhr-payroll-dist-mvbannerccbinghamtonedu)
- [BUHR.BUHR_PERSEMP_MV@BANNER.CC.BINGHAMTON.EDU](#buhrbuhr-persemp-mvbannerccbinghamtonedu)
- [BUHR.BUHR_PERSON_EMPL_MV@BANNER.CC.BINGHAMTON.EDU](#buhrbuhr-person-empl-mvbannerccbinghamtonedu)
- [BUHR.BUHR_PERSON_MV@BANNER.CC.BINGHAMTON.EDU](#buhrbuhr-person-mvbannerccbinghamtonedu)
- [BUHR.BUHR_POST_SECONDARY_MV@BANNER.CC.BINGHAMTON.EDU](#buhrbuhr-post-secondary-mvbannerccbinghamtonedu)
- [BUHR.BUHR_SALARY_MV@BANNER.CC.BINGHAMTON.EDU](#buhrbuhr-salary-mvbannerccbinghamtonedu)
- [BUHR_ADDRESS_MV@BANNER.CC.BINGHAMTON.EDU](#buhr-address-mvbannerccbinghamtonedu)
- [BUHR_COMMITMENT_MV@BANNER.CC.BINGHAMTON.EDU](#buhr-commitment-mvbannerccbinghamtonedu)
- [BUHR_EMAIL_MV@BANNER.CC.BINGHAMTON.EDU](#buhr-email-mvbannerccbinghamtonedu)
- [BUHR_GENERAL_INFO_MV@BANNER.CC.BINGHAMTON.EDU](#buhr-general-info-mvbannerccbinghamtonedu)
- [BUHR_PERSON_MV@BANNER.CC.BINGHAMTON.EDU](#buhr-person-mvbannerccbinghamtonedu)
- [BUHR_PHONE_MV@BANNER.CC.BINGHAMTON.EDU](#buhr-phone-mvbannerccbinghamtonedu)
- [BUHR_POSITION_MV@BANNER.CC.BINGHAMTON.EDU](#buhr-position-mvbannerccbinghamtonedu)
- [GOREMAL@BANNER.CC.BINGHAMTON.EDU](#goremalbannerccbinghamtonedu)
- [HRFORMS2_](#hrforms2-)
- [HRFORMS2_ACTION_CODES](#hrforms2-action-codes)
- [HRFORMS2_FORMS](#hrforms2-forms)
- [HRFORMS2_FORMS_ARCHIVE](#hrforms2-forms-archive)
- [HRFORMS2_FORMS_DRAFTS](#hrforms2-forms-drafts)
- [HRFORMS2_FORMS_HIERARCHY](#hrforms2-forms-hierarchy)
- [HRFORMS2_FORMS_HIERARCHY_GROUPS](#hrforms2-forms-hierarchy-groups)
- [HRFORMS2_FORMS_JOURNAL](#hrforms2-forms-journal)
- [HRFORMS2_FORMS_JOURNAL_ARCHIVE](#hrforms2-forms-journal-archive)
- [HRFORMS2_FORMS_JOURNAL_LAST](#hrforms2-forms-journal-last)
- [HRFORMS2_FORMS_WORKFLOW](#hrforms2-forms-workflow)
- [HRFORMS2_FORM_CODES](#hrforms2-form-codes)
- [HRFORMS2_GROUPS](#hrforms2-groups)
- [HRFORMS2_GROUPS_HISTORY](#hrforms2-groups-history)
- [HRFORMS2_GROUP_DEPARTMENTS](#hrforms2-group-departments)
- [HRFORMS2_LISTS](#hrforms2-lists)
- [HRFORMS2_NEWS](#hrforms2-news)
- [HRFORMS2_PAYROLL_CODES](#hrforms2-payroll-codes)
- [HRFORMS2_PAYROLL_TRANSACTIONS](#hrforms2-payroll-transactions)
- [HRFORMS2_REQUEST](#hrforms2-request)
- [HRFORMS2_REQUESTS](#hrforms2-requests)
- [HRFORMS2_REQUESTS_ARCHIVE](#hrforms2-requests-archive)
- [HRFORMS2_REQUESTS_DRAFTS](#hrforms2-requests-drafts)
- [HRFORMS2_REQUESTS_HIERARCHY](#hrforms2-requests-hierarchy)
- [HRFORMS2_REQUESTS_HIERARCHY_GROUPS](#hrforms2-requests-hierarchy-groups)
- [HRFORMS2_REQUESTS_JOURNAL](#hrforms2-requests-journal)
- [HRFORMS2_REQUESTS_JOURNAL_ARCHIVE](#hrforms2-requests-journal-archive)
- [HRFORMS2_REQUESTS_JOURNAL_LAST](#hrforms2-requests-journal-last)
- [HRFORMS2_REQUESTS_WORKFLOW](#hrforms2-requests-workflow)
- [HRFORMS2_SESSIONS](#hrforms2-sessions)
- [HRFORMS2_SESSION_OVERRIDE](#hrforms2-session-override)
- [HRFORMS2_SETTINGS](#hrforms2-settings)
- [HRFORMS2_TEMPLATES](#hrforms2-templates)
- [HRFORMS2_TRANSACTION_CODES](#hrforms2-transaction-codes)
- [HRFORMS2_USERS](#hrforms2-users)
- [HRFORMS2_USER_DEPARTMENTS](#hrforms2-user-departments)
- [HRFORMS2_USER_GROUPS](#hrforms2-user-groups)
- [SGBSTDN@BANNER.CC.BINGHAMTON.EDU](#sgbstdnbannerccbinghamtonedu)
- [SHREVNT@BANNER.CC.BINGHAMTON.EDU](#shrevntbannerccbinghamtonedu)
- [SHRLGPA@BANNER.CC.BINGHAMTON.EDU](#shrlgpabannerccbinghamtonedu)
- [SHRTCKG@BANNER.CC.BINGHAMTON.EDU](#shrtckgbannerccbinghamtonedu)
- [SMRPRLE@BANNER.CC.BINGHAMTON.EDU](#smrprlebannerccbinghamtonedu)
- [SPRIDEN@BANNER.CC.BINGHAMTON.EDU](#spridenbannerccbinghamtonedu)
- [STVCLAS@BANNER.CC.BINGHAMTON.EDU](#stvclasbannerccbinghamtonedu)
- [STVMAJR@BANNER.CC.BINGHAMTON.EDU](#stvmajrbannerccbinghamtonedu)
- [STVRESD@BANNER.CC.BINGHAMTON.EDU](#stvresdbannerccbinghamtonedu)
- [STVTERM@BANNER.CC.BINGHAMTON.EDU](#stvtermbannerccbinghamtonedu)
- [SUNYHR.CAMPUS_DEPARTMENTS@BANNER.CC.BINGHAMTON.EDU](#sunyhrcampus-departmentsbannerccbinghamtonedu)
- [SUNYHR.DEGREE_INSTITUTIONS@BANNER.CC.BINGHAMTON.EDU](#sunyhrdegree-institutionsbannerccbinghamtonedu)
- [SUNYHR.FOREIGN_DEGREE_INSTITUTIONS@BANNER.CC.BINGHAMTON.EDU](#sunyhrforeign-degree-institutionsbannerccbinghamtonedu)
- [SUNYHR.HR_EMAIL@BANNER.CC.BINGHAMTON.EDU](#sunyhrhr-emailbannerccbinghamtonedu)

## BUHR.BUHR_ADDITIONAL_SALARY_MV@BANNER.CC.BINGHAMTON.EDU
**Fields referenced:**
- `ADDL_SALARY_AMOUNT`
- `ADDL_SALARY_EARNING_CODE`
- `ADDL_SALARY_EFFECTIVE_DATE`
- `ADDL_SALARY_END_DATE`
- `HR_ADDITIONAL_SALARY_ID`

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)

## BUHR.BUHR_COMMITMENT_MV@BANNER.CC.BINGHAMTON.EDU
**Fields referenced:**
- `C.ACCOUNT_NUMBER`
- `C.COMMITMENT_EFFECTIVE_DATE`
- `C.COMMITMENT_END_DATE`
- `C.COMMITMENT_RATE`
- `C.DUTIES`
- `C.HR_COMMITMENT_ID`
- `C.REPORTING_DEPARTMENT_CODE`
- `C.REPORTING_DEPARTMENT_NAME`
- `C.STUDENT_AWARD_AMOUNT`
- `C.SUPERVISOR_SUNY_ID`
- `NUMBER_OF_PAYMENTS`
- `RATE_AMOUNT`
- `RATE_EFFECTIVE_DATE`

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)
- [`api/classes/personlookup.php`](api/classes/personlookup.php)

## BUHR.BUHR_EMERGENCY_CONTACT_MV@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/personinfo.php`](api/classes/personinfo.php)

## BUHR.BUHR_EMPL_STATUS_MV@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)

## BUHR.BUHR_GENERAL_INFO_MV@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/user.php`](api/classes/user.php)

## BUHR.BUHR_PAYROLL_DIST_MV@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)

## BUHR.BUHR_PERSEMP_MV@BANNER.CC.BINGHAMTON.EDU
**Fields referenced:**
- `P.APPOINTMENT_EFFECTIVE_DATE`
- `P.APPOINTMENT_END_DATE`
- `P.APPOINTMENT_PERCENT`
- `P.APPOINTMENT_TYPE`
- `P.BENEFIT_FLAG`
- `P.CAMPUS_TITLE`
- `P.CONTINUING_PERMANENCY_DATE`
- `P.DERIVED_FAC_TYPE`
- `P.LINE_ITEM_NUMBER`
- `P.NOTICE_DATE`
- `P.PAYROLL_AGENCY_CODE`
- `P.PAYROLL_MAIL_DROP_ID`
- `P.REPORTING_DEPARTMENT_CODE`
- `P.SUNY_ID`
- `P.TENURE_STATUS`
- `P.TERM_DURATION`
- `PAY_BASIS`

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)
- [`api/classes/user.php`](api/classes/user.php)

## BUHR.BUHR_PERSON_EMPL_MV@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/personlookup.php`](api/classes/personlookup.php)

## BUHR.BUHR_PERSON_MV@BANNER.CC.BINGHAMTON.EDU
**Fields referenced:**
- `PERS.HR_PERSON_ID`
- `PERS.LEGAL_LAST_NAME`
- `PERS.LEGAL_MIDDLE_NAME`
- `PERS.LOCAL_CAMPUS_ID`
- `PERS.NYS_EMPLID`
- `PERS.SUFFIX_CODE`
- `PERS.SUNY_ID`

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)
- [`api/classes/personlookup.php`](api/classes/personlookup.php)

## BUHR.BUHR_POST_SECONDARY_MV@BANNER.CC.BINGHAMTON.EDU
**Fields referenced:**
- `E.CREATE_DATE`
- `E.DEGREE_MONTH`
- `E.DEGREE_PROGRAM_CODE`
- `E.DEGREE_PROGRAM_DESCRIPTION`
- `E.DEGREE_TYPE`
- `E.DEGREE_VERIFIED`
- `E.DEGREE_YEAR`
- `E.HIGHEST_DEGREE_FLAG`
- `E.PENDING_DEGREE_FLAG`
- `E.TERMINAL_DEGREE_FLAG`

**Referenced in:**
- [`api/classes/personinfo.php`](api/classes/personinfo.php)

## BUHR.BUHR_SALARY_MV@BANNER.CC.BINGHAMTON.EDU
**Fields referenced:**
- `CALCULATED_ANNUAL`
- `NUMBER_OF_PAYMENTS`
- `RATE_AMOUNT`
- `RATE_EFFECTIVE_DATE`
- `SALARY_EFFECTIVE_DATE`

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)

## BUHR_ADDRESS_MV@BANNER.CC.BINGHAMTON.EDU
**Fields referenced:**
- `A.ADDRESS_1`
- `A.ADDRESS_2`
- `A.ADDRESS_3`
- `A.ADDRESS_CITY`
- `A.ADDRESS_CODE`
- `A.ADDRESS_POSTAL_CODE`
- `A.CREATE_DATE`
- `A.STATE_CODE`

**Referenced in:**
- [`api/classes/personinfo.php`](api/classes/personinfo.php)

## BUHR_COMMITMENT_MV@BANNER.CC.BINGHAMTON.EDU
**Fields referenced:**
- `C.CAMPUS_TITLE`
- `C.COMMITMENT_EFFECTIVE_DATE`
- `C.COMMITMENT_END_DATE`
- `C.COMMITMENT_PRIMARY_FLAG`
- `C.COMMITMENT_STACK_ID`
- `C.CREATE_DATE`
- `C.DUTIES`
- `C.HR_COMMITMENT_ID`
- `C.REPORTING_DEPARTMENT_CODE`
- `C.SUPERVISOR_SUNY_ID`
- `C.WORK_ALLOCATION`

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)

## BUHR_EMAIL_MV@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/personinfo.php`](api/classes/personinfo.php)

## BUHR_GENERAL_INFO_MV@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/personinfo.php`](api/classes/personinfo.php)

## BUHR_PERSON_MV@BANNER.CC.BINGHAMTON.EDU
**Fields referenced:**
- `P.ALIAS_FIRST_NAME`
- `P.HR_PERSON_ID`
- `P.LEGAL_FIRST_NAME`
- `P.LEGAL_LAST_NAME`
- `P.LEGAL_MIDDLE_NAME`
- `P.LOCAL_CAMPUS_ID`
- `P.SALUTATION_CODE`
- `P.SUFFIX_CODE`
- `P.SUNY_ID`

**Referenced in:**
- [`api/classes/personinfo.php`](api/classes/personinfo.php)

## BUHR_PHONE_MV@BANNER.CC.BINGHAMTON.EDU
**Fields referenced:**
- `A.CELL_INDICATOR`
- `A.CREATE_DATE`
- `A.PHONE_TYPE`

**Referenced in:**
- [`api/classes/personinfo.php`](api/classes/personinfo.php)

## BUHR_POSITION_MV@BANNER.CC.BINGHAMTON.EDU
**Fields referenced:**
- `EFFECTIVE_DATE`
- `LINE_NUMBER`
- `NEGOTIATING_UNIT`
- `PAYROLL`
- `PAY_BASIS`
- `POSITION_DEPARTMENT`
- `POSITION_DEPARTMENT_CODE`
- `POSITION_ID`
- `POSITION_PERCENT`
- `POSITION_STATUS`
- `SALARY_GRADE`
- `SEGMENT_CODE`
- `TITLE`

**Referenced in:**
- [`api/classes/position.php`](api/classes/position.php)

## GOREMAL@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/HRForms2.php`](api/classes/HRForms2.php)

## HRFORMS2_
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/codes.php`](api/classes/codes.php)

## HRFORMS2_ACTION_CODES
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/hierarchy.php`](api/classes/hierarchy.php)
- [`api/classes/hierarchypaged.php`](api/classes/hierarchypaged.php)
- [`api/classes/paytrans.php`](api/classes/paytrans.php)

## HRFORMS2_FORMS
**Fields referenced:**
- `F.FORM_DATA.EFFDATE`
- `F.FORM_DATA.GROUPS`
- `F.FORM_DATA.WORKFLOW_ID`
- `F.FORM_ID`

**Referenced in:**
- [`api/classes/archive.php`](api/classes/archive.php)
- [`api/classes/check.php`](api/classes/check.php)
- [`api/classes/counts.php`](api/classes/counts.php)
- [`api/classes/formlist.php`](api/classes/formlist.php)
- [`api/classes/forms.php`](api/classes/forms.php)
- [`api/classes/paytrans.php`](api/classes/paytrans.php)

## HRFORMS2_FORMS_ARCHIVE
**Fields referenced:**
- `CREATED_BY`
- `CREATED_DATE`
- `F.FORM_DATA.EFFDATE`
- `F.FORM_DATA.WORKFLOW_ID`
- `F.FORM_ID`
- `FORM_DATA`

**Referenced in:**
- [`api/classes/archive.php`](api/classes/archive.php)
- [`api/classes/archivelist.php`](api/classes/archivelist.php)
- [`api/classes/forms.php`](api/classes/forms.php)

## HRFORMS2_FORMS_DRAFTS
**Fields referenced:**
- `ACTION_CODE`
- `ACTION_TITLE`
- `DATA`
- `DRAFTS.DATA.EFFDATE`
- `FIRST_NAME`
- `FORM_CODE`
- `FORM_ID`
- `FORM_TITLE`
- `GROUPS`
- `JOURNAL_STATUS`
- `LEGAL_LAST_NAME`
- `LEGAL_MIDDLE_NAME`
- `LINE_NUMBER`
- `MAX_JOURNAL_DATE`
- `PAYROLL_CODE`
- `PAYROLL_DESCRIPTION`
- `PAYROLL_TITLE`
- `SEQUENCE`
- `SUNY_ID`
- `TITLE`
- `TRANSACTION_CODE`
- `TRANSACTION_TITLE`
- `UNIX_TS`

**Referenced in:**
- [`api/classes/counts.php`](api/classes/counts.php)
- [`api/classes/formlist.php`](api/classes/formlist.php)
- [`api/classes/forms.php`](api/classes/forms.php)
- [`api/classes/paytrans.php`](api/classes/paytrans.php)

## HRFORMS2_FORMS_HIERARCHY
**Fields referenced:**
- `H.HIERARCHY_ID`
- `H.PAYTRANS_ID`
- `H.WORKFLOW_ID`

**Referenced in:**
- [`api/classes/hierarchy.php`](api/classes/hierarchy.php)
- [`api/classes/hierarchypaged.php`](api/classes/hierarchypaged.php)

## HRFORMS2_FORMS_HIERARCHY_GROUPS
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/hierarchy.php`](api/classes/hierarchy.php)

## HRFORMS2_FORMS_JOURNAL
**Fields referenced:**
- `SEQUENCE`
- `STATUS`

**Referenced in:**
- [`api/classes/archive.php`](api/classes/archive.php)
- [`api/classes/counts.php`](api/classes/counts.php)
- [`api/classes/formlist.php`](api/classes/formlist.php)
- [`api/classes/forms.php`](api/classes/forms.php)

## HRFORMS2_FORMS_JOURNAL_ARCHIVE
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/archive.php`](api/classes/archive.php)
- [`api/classes/archivelist.php`](api/classes/archivelist.php)

## HRFORMS2_FORMS_JOURNAL_LAST
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/counts.php`](api/classes/counts.php)

## HRFORMS2_FORMS_WORKFLOW
**Fields referenced:**
- `GROUPS`
- `W.CONDITIONS`
- `W.WORKFLOW_ID`
- `WORKFLOW_ID`

**Referenced in:**
- [`api/classes/groups.php`](api/classes/groups.php)
- [`api/classes/hierarchy.php`](api/classes/hierarchy.php)
- [`api/classes/hierarchypaged.php`](api/classes/hierarchypaged.php)

## HRFORMS2_FORM_CODES
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/hierarchy.php`](api/classes/hierarchy.php)
- [`api/classes/hierarchypaged.php`](api/classes/hierarchypaged.php)
- [`api/classes/paytrans.php`](api/classes/paytrans.php)

## HRFORMS2_GROUPS
**Fields referenced:**
- `END_DATE`
- `GROUP_DESCRIPTION`
- `GROUP_NAME`
- `START_DATE`

**Referenced in:**
- [`api/classes/deptgroup.php`](api/classes/deptgroup.php)
- [`api/classes/groups.php`](api/classes/groups.php)
- [`api/classes/groupshistory.php`](api/classes/groupshistory.php)
- [`api/classes/hierarchy.php`](api/classes/hierarchy.php)
- [`api/classes/hierarchypaged.php`](api/classes/hierarchypaged.php)
- [`api/classes/journal.php`](api/classes/journal.php)
- [`api/classes/requestlist.php`](api/classes/requestlist.php)
- [`api/classes/user.php`](api/classes/user.php)

## HRFORMS2_GROUPS_HISTORY
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/groups.php`](api/classes/groups.php)
- [`api/classes/groupshistory.php`](api/classes/groupshistory.php)
- [`api/classes/requestlist.php`](api/classes/requestlist.php)

## HRFORMS2_GROUP_DEPARTMENTS
**Fields referenced:**
- `GROUP_ID`

**Referenced in:**
- [`api/classes/HRForms2.php`](api/classes/HRForms2.php)
- [`api/classes/deptgroup.php`](api/classes/deptgroup.php)
- [`api/classes/groupdepts.php`](api/classes/groupdepts.php)
- [`api/classes/user.php`](api/classes/user.php)

## HRFORMS2_LISTS
**Fields referenced:**
- `LIST_DATA`
- `LIST_ID`
- `LIST_NAME`
- `LIST_SLUG`
- `LIST_TYPE`
- `PROTECTED`

**Referenced in:**
- [`api/classes/listdata.php`](api/classes/listdata.php)
- [`api/classes/lists.php`](api/classes/lists.php)

## HRFORMS2_NEWS
**Fields referenced:**
- `CNT`
- `MODIFIED_BY`
- `MODIFIED_DATE`
- `NEWS_TEXT`

**Referenced in:**
- [`api/classes/news.php`](api/classes/news.php)

## HRFORMS2_PAYROLL_CODES
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/hierarchy.php`](api/classes/hierarchy.php)
- [`api/classes/hierarchypaged.php`](api/classes/hierarchypaged.php)
- [`api/classes/paytrans.php`](api/classes/paytrans.php)

## HRFORMS2_PAYROLL_TRANSACTIONS
**Fields referenced:**
- `ACTIVE`
- `PT.ACTION_CODE`
- `PT.ACTIVE`
- `PT.AVAILABLE_FOR`
- `PT.FORM_CODE`
- `PT.PAYROLL_CODE`
- `PT.PAYTRANS_ID`
- `PT.PR_REQUIRED`
- `PT.ROUTE_BY`
- `PT.TABS`
- `PT.TRANSACTION_CODE`

**Referenced in:**
- [`api/classes/codes.php`](api/classes/codes.php)
- [`api/classes/forms.php`](api/classes/forms.php)
- [`api/classes/hierarchy.php`](api/classes/hierarchy.php)
- [`api/classes/hierarchypaged.php`](api/classes/hierarchypaged.php)
- [`api/classes/paytrans.php`](api/classes/paytrans.php)

## HRFORMS2_REQUEST
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/requests.php`](api/classes/requests.php)

## HRFORMS2_REQUESTS
**Fields referenced:**
- `R.CREATED_BY.ALIAS_FIRST_NAME`
- `R.CREATED_BY.LEGAL_FIRST_NAME`
- `R.CREATED_BY.LEGAL_LAST_NAME`
- `R.REQUEST_DATA.CANDIDATENAME`
- `R.REQUEST_DATA.EFFDATE`
- `R.REQUEST_DATA.GROUPS`
- `R.REQUEST_DATA.LINENUMBER`
- `R.REQUEST_DATA.POSTYPE`
- `R.REQUEST_DATA.REQBUDGETTITLE.TITLE`
- `R.REQUEST_DATA.REQTYPE`
- `R.REQUEST_DATA.WORKFLOW_ID`
- `R.REQUEST_ID`
- `REQUEST_DATA`

**Referenced in:**
- [`api/classes/archive.php`](api/classes/archive.php)
- [`api/classes/counts.php`](api/classes/counts.php)
- [`api/classes/requestlist.php`](api/classes/requestlist.php)
- [`api/classes/requests.php`](api/classes/requests.php)

## HRFORMS2_REQUESTS_ARCHIVE
**Fields referenced:**
- `CREATED_BY`
- `CREATED_DATE`
- `R.REQUEST_DATA.CANDIDATENAME`
- `R.REQUEST_DATA.EFFDATE`
- `R.REQUEST_DATA.LINENUMBER`
- `R.REQUEST_DATA.MULTILINES`
- `R.REQUEST_DATA.POSTYPE`
- `R.REQUEST_DATA.REQBUDGETTITLE.TITLE`
- `R.REQUEST_DATA.REQTYPE`
- `R.REQUEST_DATA.WORKFLOW_ID`
- `R.REQUEST_ID`
- `REQUEST_DATA`

**Referenced in:**
- [`api/classes/archive.php`](api/classes/archive.php)
- [`api/classes/archivelist.php`](api/classes/archivelist.php)
- [`api/classes/requests.php`](api/classes/requests.php)

## HRFORMS2_REQUESTS_DRAFTS
**Fields referenced:**
- `DATA`
- `DRAFTS.DATA.CANDIDATENAME`
- `DRAFTS.DATA.EFFDATE`
- `DRAFTS.DATA.LINENUMBER`
- `DRAFTS.DATA.POSTYPE`
- `DRAFTS.DATA.REQBUDGETTITLE.TITLE`
- `DRAFTS.DATA.REQTYPE`
- `GROUPS`
- `JOURNAL_STATUS`
- `MAX_JOURNAL_DATE`
- `REQUEST_ID`
- `SEQUENCE`
- `STATUS`
- `SUNY_ID`
- `UNIX_TS`

**Referenced in:**
- [`api/classes/counts.php`](api/classes/counts.php)
- [`api/classes/requestlist.php`](api/classes/requestlist.php)
- [`api/classes/requests.php`](api/classes/requests.php)

## HRFORMS2_REQUESTS_HIERARCHY
**Fields referenced:**
- `H.HIERARCHY_ID`
- `H.POSITION_TYPE`
- `H.WORKFLOW_ID`

**Referenced in:**
- [`api/classes/hierarchy.php`](api/classes/hierarchy.php)
- [`api/classes/hierarchypaged.php`](api/classes/hierarchypaged.php)

## HRFORMS2_REQUESTS_HIERARCHY_GROUPS
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/hierarchy.php`](api/classes/hierarchy.php)

## HRFORMS2_REQUESTS_JOURNAL
**Fields referenced:**
- `SEQUENCE`
- `STATUS`

**Referenced in:**
- [`api/classes/archive.php`](api/classes/archive.php)
- [`api/classes/counts.php`](api/classes/counts.php)
- [`api/classes/requestlist.php`](api/classes/requestlist.php)
- [`api/classes/requests.php`](api/classes/requests.php)

## HRFORMS2_REQUESTS_JOURNAL_ARCHIVE
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/archive.php`](api/classes/archive.php)
- [`api/classes/archivelist.php`](api/classes/archivelist.php)
- [`api/classes/requestlist.php`](api/classes/requestlist.php)

## HRFORMS2_REQUESTS_JOURNAL_LAST
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/counts.php`](api/classes/counts.php)

## HRFORMS2_REQUESTS_WORKFLOW
**Fields referenced:**
- `GROUPS`
- `W.CONDITIONS`
- `W.WORKFLOW_ID`
- `WORKFLOW_ID`

**Referenced in:**
- [`api/classes/groups.php`](api/classes/groups.php)
- [`api/classes/hierarchy.php`](api/classes/hierarchy.php)
- [`api/classes/hierarchypaged.php`](api/classes/hierarchypaged.php)

## HRFORMS2_SESSIONS
**Fields referenced:**
- `BNUMBER`
- `IP_ADDRESS`
- `LAST_IP_ADDRESS`
- `LAST_LOGIN_DATE`
- `LOGIN_DATE`
- `MY_RANK`
- `S.BNUMBER`
- `S.IP_ADDRESS`
- `S.SUNY_ID`
- `S.USER_ID`
- `SUNY_ID`
- `USER_AGENT`
- `USER_ID`

**Referenced in:**
- [`api/classes/HRForms2.php`](api/classes/HRForms2.php)
- [`api/classes/loginhistory.php`](api/classes/loginhistory.php)
- [`api/classes/session.php`](api/classes/session.php)

## HRFORMS2_SESSION_OVERRIDE
**Fields referenced:**
- `END_OVERRIDE`

**Referenced in:**
- [`api/classes/HRForms2.php`](api/classes/HRForms2.php)
- [`api/classes/session.php`](api/classes/session.php)

## HRFORMS2_SETTINGS
**Fields referenced:**
- `S.SETTINGS.FORMS.DEFAULTWORKFLOW`
- `S.SETTINGS.REQUESTS.DEFAULTWORKFLOW`
- `SETTINGS`

**Referenced in:**
- [`api/classes/hierarchy.php`](api/classes/hierarchy.php)
- [`api/classes/hierarchypaged.php`](api/classes/hierarchypaged.php)
- [`api/classes/settings.php`](api/classes/settings.php)

## HRFORMS2_TEMPLATES
**Fields referenced:**
- `TEMPLATE`
- `TEMPLATE_ID`
- `TEMPLATE_NAME`
- `TEMPLATE_SLUG`
- `TEMPLATE_STATUS_CODE`
- `TEMPLATE_TYPE`

**Referenced in:**
- [`api/classes/template.php`](api/classes/template.php)

## HRFORMS2_TRANSACTION_CODES
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/hierarchy.php`](api/classes/hierarchy.php)
- [`api/classes/hierarchypaged.php`](api/classes/hierarchypaged.php)
- [`api/classes/paytrans.php`](api/classes/paytrans.php)

## HRFORMS2_USERS
**Fields referenced:**
- `D.GROUP_ID`
- `END_DATE`
- `G.GROUP_NAME`
- `IS_VIEWER`
- `NOTIFICATIONS`
- `REFRESH_DATE`
- `SUNY_ID`
- `U.CREATED_BY`
- `U.CREATED_DATE`
- `U.END_DATE`
- `U.START_DATE`
- `U.SUNY_ID`
- `U.USER_INFO`
- `U1.SUNY_ID`
- `USER_INFO`
- `USER_OPTIONS`
- `USER_SUNY_ID`
- `VIEWER`

**Referenced in:**
- [`api/classes/HRForms2.php`](api/classes/HRForms2.php)
- [`api/classes/archivelist.php`](api/classes/archivelist.php)
- [`api/classes/groupusers.php`](api/classes/groupusers.php)
- [`api/classes/user.php`](api/classes/user.php)

## HRFORMS2_USER_DEPARTMENTS
**Fields referenced:**
- `DEPARTMENT_CODE`

**Referenced in:**
- [`api/classes/journal.php`](api/classes/journal.php)
- [`api/classes/userdepts.php`](api/classes/userdepts.php)

## HRFORMS2_USER_GROUPS
**Fields referenced:**
- `GROUP_ID`
- `IS_ADMIN`

**Referenced in:**
- [`api/classes/HRForms2.php`](api/classes/HRForms2.php)
- [`api/classes/archivelist.php`](api/classes/archivelist.php)
- [`api/classes/counts.php`](api/classes/counts.php)
- [`api/classes/formlist.php`](api/classes/formlist.php)
- [`api/classes/groupusers.php`](api/classes/groupusers.php)
- [`api/classes/journal.php`](api/classes/journal.php)
- [`api/classes/requestlist.php`](api/classes/requestlist.php)
- [`api/classes/user.php`](api/classes/user.php)
- [`api/classes/usergroups.php`](api/classes/usergroups.php)

## SGBSTDN@BANNER.CC.BINGHAMTON.EDU
**Fields referenced:**
- `S.SGBSTDN_TERM_CODE_EFF`

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)

## SHREVNT@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)

## SHRLGPA@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)

## SHRTCKG@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)

## SMRPRLE@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)

## SPRIDEN@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/HRForms2.php`](api/classes/HRForms2.php)
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)

## STVCLAS@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)

## STVMAJR@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)

## STVRESD@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)

## STVTERM@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/employmentinfo.php`](api/classes/employmentinfo.php)

## SUNYHR.CAMPUS_DEPARTMENTS@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/deptgroup.php`](api/classes/deptgroup.php)
- [`api/classes/personlookup.php`](api/classes/personlookup.php)

## SUNYHR.DEGREE_INSTITUTIONS@BANNER.CC.BINGHAMTON.EDU
**Fields referenced:**
- `I.COUNTRY_CODE`
- `I.INSTITUTION`
- `I.INSTITUTION_CITY`
- `I.INSTITUTION_ID`
- `I.INSTITUTION_STATE`
- `ID`
- `INSTITUTION`
- `INSTITUTION_ADDRESS`
- `INSTITUTION_CITY`
- `INSTITUTION_COUNTRY_CODE`
- `INSTITUTION_STATE`
- `INSTITUTION_ZIP`

**Referenced in:**
- [`api/classes/education.php`](api/classes/education.php)
- [`api/classes/personinfo.php`](api/classes/personinfo.php)

## SUNYHR.FOREIGN_DEGREE_INSTITUTIONS@BANNER.CC.BINGHAMTON.EDU
**Fields referenced:**
- `F.COUNTRY_CODE`
- `F.INSTITUTION`
- `ID`
- `INSTITUTION`
- `INSTITUTION_ADDRESS`
- `INSTITUTION_CITY`
- `INSTITUTION_COUNTRY_CODE`
- `INSTITUTION_STATE`
- `INSTITUTION_ZIP`

**Referenced in:**
- [`api/classes/education.php`](api/classes/education.php)
- [`api/classes/personinfo.php`](api/classes/personinfo.php)

## SUNYHR.HR_EMAIL@BANNER.CC.BINGHAMTON.EDU
*No explicit field references parsed from this file.*

**Referenced in:**
- [`api/classes/groupusers.php`](api/classes/groupusers.php)
