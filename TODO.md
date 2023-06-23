# TODO List
Bug fixes, enhancements and things still to complete.

## Bug Fix:
  * Pending Form View (as submitter) create new form does not clear warning alert box.
  * SGRIILLS showing as "ERR: DUPLICATE IDs" on email notification in old HR Forms PR request.
  * TEST FORM: When person has no IDs (in prod: Keisha Wint, DOB: 8/23/1974)
    - Mostly works, some errors with origSalary, but may be moot because of using TEST form code.

## Test:
  * Request: auto-approve next code

## In Progress Tasks:
  * Use Helmet to change the title of the page
  * Email notification; auto-approved should not get emails (need to test/check this)
  * Request: Move config items into config/request.js file.
  * Request|Form: Control who can view/edit based on status (see TODO in file)
  * Add CSS for printing
  * Change delete modals to component: ModalConfirm
  * [DONE] - Remove last group from skip select list - cannot skip the last group.
    - Handle when hiearchy/workflow changed.
  * Use table partitioning for managing requests and forms (see: https://docs.oracle.com/en/database/oracle/oracle-database/12.2/vldbg/partition-create-tables-indexes.html)
  
## Tasks: 
  * Request|Form: Archived should save groups, hierarchy, and workflow
  * Request|Form: Approvals should have "save and exit" option?
  * Request|Form: Archived list needs date filter; default should limit range?
  * Request: User should NOT be able to approve/reject requests they submitted.
  * FormList and RequestList; drop the additional formId, requestId and just use POSTvars.
  * Forms: Auto focus fields
  * Search for "TODO" in files
  * Search for "console.log" in files
  * Create list of standard hotkeys for application.
  * Users: Ability to download user list for auditing
  * Admin - Forms: Delete paytrans should check to see usage and handle
  * Switch from username to B# as primary key
  * Admin: Add default routing in settings
  * On app error allow "reset"; test with undefined import component.
  * Add print to PDF
  * Forms: Default WF for all payrolls/forms?
  * DataTables:
    - Add search-by-field as needed (see groups.js)
    - Global setting for paginationRowsPerPageOptions
  * Consolidate Title/Text of modals/confirmations - use config? i18n-next?  Can probably do something simpler.

## Upgrades:
  * Upgrade to Bootstrap v5
  * Upgrade to React Query v4
  * Upgrade to React Router v6

## Future Enhancements
  * Request|Form: Allow copy/create as draft from archived/submitted?
  * Add Help menu with Help, About items
  * Admin Lists: make list data an l/v pair
  * Users: Search/Filter by group in users (need to add group info in query)
  * Custom context (right-click) menu (https://fkhadra.github.io/react-contexify/)
  * Allow global configuration of DatePicker dateFormat
  * Allow upload of data to Admin Lists
  * CountryCode -> "State" tranlation interface needed (see education.php)
  * Add ability to resend email to groups for PR or Form
  * Lists should use useFormContext() - need to clean up page.
  * Add ability to selectively search columns on the hierarchy. (e.g. only show specific PosType), Only show specific WFIDs

## New Banner Grants Needed:
  * STVCLAS
  * STVTERM

## Notes:
### Requests|Forms: 
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
  * PF will go right to Z (Archived)
  * There will be no "F" (Final Approved)
  * Future enhancement will add in batch option to send to SUNY
    * PF -> BP (Batch Pending)
    * if Batch is successful BP -> Z
    * if Batch has error BP -> BE (Batch Error)

