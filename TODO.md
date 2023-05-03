# TODO List
Bug fixes, enhancements and things still to complete.

## Bug Fix:
  * TabRouters are wrong; need to use React.memo and send ACTIVE tab, not tab.  If tab is sent all tabs are generated on load rather than only the active one.
  * SGRIILLS showing as "ERR: DUPLICATE IDs" on email notification in old HR Forms PR request.
  * When no member of a group has email notifications approving PR will error.
  * TEST FORM: When person has no IDs (in prod: Keisha Wint, DOB: 8/23/1974)
    - Mostly works, some errors with origSalary, but may be moot because of using TEST form code.

## In Progress Tasks:
  * Email notification
  * Rename contexts to use*Context() for consistency (see app.js)
  * Clean up queries and remove queries.js
  * Form: Complete Review page
  * FormList and RequestList; drop the additional formId, requestId and just use POSTvars.
  * Request/Forms: Finish Final Approval and Archive
  * Change delete modals to component: ModalConfirm
  * "globalize" icons (e.g. the "save" icon should be the same for all; this may be making buttons a component)
  * Use table partitioning for managing requests and forms (see: https://docs.oracle.com/en/database/oracle/oracle-database/12.2/vldbg/partition-create-tables-indexes.html)
  * Hide News box on homepage for 24 hours or until new

## Tasks: 
  * Request: Move config items into config/request.js file.
  * Request: Control who can view/edit based on status (see TODO in file)
  * Forms: Auto focus fields
  * Request: Approver in next group auto-approve (done in forms)
  * Create list of standard hotkeys for application.
  * Users: Ability to download user list for auditing
  * Admin - Forms: Delete paytrans should check to see usage and handle
  * Switch from username to B# as primary key
  * Request: User should NOT be able to approve/reject requests they submitted.
  * Remove last group from skip select list - cannot skip the last one.  Need to handle when changed.
  * Use Helmet to change the title of the page
  * Admin: Add default routing in settings
  * On app error allow "reset"; test with undefined import component.
  * Add print to PDF
  * Add CSS for printing
  * Forms: Default WF for all payrolls/forms?
  * Forms|Requests: rejections - resubmit or delete - set back to "draft"
  * Search for "TODO" in files
  * DataTables:
    - Add search-by-field as needed (see groups.js)
    - Global setting for paginationRowsPerPageOptions

## Upgrades:
  * Upgrade to Bootstrap v5
  * Upgrade to React Query v4
  * Upgrade to React Router v6

## Future Enhancements
  * Add Help menu with Help, About items
  * Admin Lists: make list data an l/v pair
  * Add setting control to allow/disabled subsequent approver skips and message.
  * Users: Search by group in users (need to add group info in query)
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

## Questions for HR:
  * Form approvals:
    - if submitter is not in dept approval group, should it go?
  * Review Transaction Codes (in progress - VM)
  * Employment -> Salary Tab: Addl Salary and Split Assignment - should fields be required?  If so, which?