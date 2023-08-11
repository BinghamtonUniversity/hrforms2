# TODO List
Bug fixes, enhancements and things still to complete.

## Bug Fix:
  * SGRIILLS showing as "ERR: DUPLICATE IDs" on email notification in old HR Forms PR request.
  * TEST FORM: When person has no IDs (in prod: Keisha Wint, DOB: 8/23/1974)
    - Mostly works, some errors with origSalary, but may be moot because of using TEST form code.

## Test:
  * Request: auto-approve next code
  * Form: Create Archive view
  * Email notification; auto-approved should not get emails (need to test/check this)

## In Progress Tasks:
  * Search for "console.log" in files
  * Use Helmet to change the title of the page
  * Request|Form: Control who can view/edit based on status (see TODO in file)
  * Add CSS for printing
  * Change delete modals to component: ModalConfirm
  * Consolidate Title/Text of modals/confirmations - use config
  * [DONE] - Remove last group from skip select list - cannot skip the last group.
    - Handle when hiearchy/workflow changed.
  * Use table partitioning for managing requests and forms (see: https://docs.oracle.com/en/database/oracle/oracle-database/12.2/vldbg/partition-create-tables-indexes.html)
  
## Tasks: 
  * Change queries to use Global ID?
  * Account Numbers: do we need to include the Fiscal Year?
  * Archive - Request|Form: Should save groups, hierarchy, and workflow
  * Archive - Request|Form: List needs date filter; default should limit range?
  * Forms: SUNY Account data needs to be completed
  * Request: User should NOT be able to approve/reject requests they submitted. [DONE?]
  * FormList and RequestList; drop the additional formId, requestId and just use POSTvars.
  * Search for "TODO" in files
  * Switch from username to B# as primary key [DONE?]
  * Admin: Add default hierarchy routing in settings
  * On app error allow "reset"; test with undefined import component.
  * Forms: Default WF for all payrolls/forms?
  * DataTables:
    - Add search-by-field as needed (see groups.js)
    - Global setting for paginationRowsPerPageOptions

## Upgrades:
  * Upgrade to React 18
  * Convert to apereo/phpcas
  * Upgrade to Bootstrap v5
  * Upgrade to React Query v4/5? (TanStack Query)
  * Upgrade to React Router v6
  * run: npm outdated

## Future Enhancements
  * Deactivating Users: Disable notifications
  * Create list of standard hotkeys for application.
  * Request|Form: Reassign ??
  * Request|Form: Allow same org/group to take ownership?
  * Forms: Keyboard navigation.  Selecting a form code auto loads tab data and auto-nexts
    - Convert focus effect on each tab to a global callback or memo?
  * Request|Form: Allow copy/create as draft from archived/submitted?
  * Forms: Search by Form Type (admin?) across all users and lists
  * Multiple appointment listings - how to display (students, faculty, etc)
  * Add Help menu with Help, About items
  * All Tables: Put filter into URL and save/use on reload.
  * All Tables: Add CSV download option/button (see users, groups, department)
  * Admin Lists: make list data an l/v pair
  * Users: Search/Filter by group in users (need to add group info in query)
  * Custom context (right-click) menu (https://fkhadra.github.io/react-contexify/)
  * Allow global configuration of DatePicker dateFormat
  * Allow upload of data to Admin Lists
  * CountryCode -> "State" tranlation interface needed (see education.php)
  * Add ability to resend email to groups for PR or Form
  * Lists should use useFormContext() - need to clean up page.
  * Add ability to selectively search columns on the hierarchy. (e.g. only show specific PosType), Only show specific WFIDs
  * Look into using i18n-next for label/title text

## New Banner Grants Needed:
  * STVCLAS
  * STVTERM

## Notes:
### Requests|Forms: 
  * Default Routing or error?

  * can approvers edit?
    * if so, what fields? all? yes (except 3 reqd fields)
  * can HR edit (final approval)?
    * if so, what fields? all? yes (except 3 reqd fields)
  * if approvers can edit, do we need to track changes?
        * future phase
  * resubmit rejections: 
    * do we need to save previous chain of approvals/comments: yes
    * should submitter be able to save changes and resubmit later (i.e. make it a "draft" again): yes
    * Can rejected be deleted? (i.e. submitter does not want to resubmit): yes

### Note: 
  * In theory all the hierarchy, workflow, and tab information is stored, so the paytrans could be delete.
  * PF will go right to Z (Archived)
  * There will be no "F" (Final Approved)
  * Future enhancement will add in batch option to send to SUNY
    * PF -> BP (Batch Pending)
    * if Batch is successful BP -> Z
    * if Batch has error BP -> BE (Batch Error)

gender -> legal sex M/F
gender identity (add)
"female","male","X"
Need to add to MV and add to query

employment-position: appt pct cannot be greater than what comes from suny

check journal for admin to search all

add: submitter info on review at bottom

employment data on review when not selected

default hierarchy: go to HR (send error notification)

add: group description as hover/popup
depts: active/inactive is not clear active/inactive (3 326)

add new user: 687005 (error)

