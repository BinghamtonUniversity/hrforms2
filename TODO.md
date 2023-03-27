# TODO List
Bug fixes, enhancements and things still to complete.

## Bug Fix:
  * Forms: Payroll still being reset/lost
  * Forms: Searching for "1" in BNumber errors.
  * Forms: remove salary endpoint; move to employmentinfo
  * Request: save and exit should not validate (missing comment and org)
  * FormList and RequestList; drop the additional formId, requestId and just use POSTvars.
  * Sorting Transation Codes by Title isn't working
  * TabRouters are wrong; need to use React.memo and send ACTIVE tab, not tab.  If tab is sent all tabs are generated on load rather than only the active one.
  * Add "id" key for all DataTables or use keyField parameter on table
  * SGRIILLS showing as "ERR: DUPLICATE IDs" on email notification in old HR Forms PR request.
  * When no member of a group has email notifications approving PR will error.

## In Progress Tasks:
  * Request: Complete approve/reject in form
  * For all tables add hotkey ctrl+f to focus the search box.
    - Add special key handling to search box component (see users.js)
    - Add search-by-field as needed (see groups.js)
  * Add progressPending/progressComponent to DataTables
  * Add noDataComponent to DataTables
  * Change delete modals to component: ModalConfirm
  * "globalize" icons (e.g. the "save" icon should be the same for all; this may be making buttons a component)
  * Use table partitioning for managing requests and forms (see: https://docs.oracle.com/en/database/oracle/oracle-database/12.2/vldbg/partition-create-tables-indexes.html)

## Tasks: 
  * Approver in sequential groups should skip.
  * Create list of standard hotkeys for application.
  * Consolidate "configuration" items config/ folder; e.g. config/form.js for form config.
  * Ability to download user list for auditing
  * Admin Lists: 
    * invalidate queries when list data in changed
    * make list data an l/v pair
  * Delete paytrans should check to see usage?
  * Switch from username to B# as primary key
  * Email notification
  * User should NOT be able to approve/reject requests they submitted.
  * Remove last group from skip select list - cannot skip the last one.  Need to handle when changed.
  * Use Helmet to change the title of the page
  * When reviewing (i.e. approver) hide tabs other than review and comments?
  * Add default routing in settings
  * On app error allow "reset"; test with undefined import component.

## Upgrades:
  * Upgrade to Bootstrap v5
  * Upgrade to React Query v4
  * Upgrade to React Router v6

## Future Enhancements
  * Custom context (right-click) menu (https://fkhadra.github.io/react-contexify/)
  * Allow global configuration of DatePicker dateFormat
  * Allow upload of data to Admin Lists
  * CountryCode -> "State" tranlation interface needed (see education.php)
  * Add ability to resend email to groups for PR or Form
  * Lists should use useFormContext() - need to clean up page.
  * Add ability to selectively search columns on the hierarchy. (e.g. only show specific PosType), Only show specific WFIDs)

## New Banner Grants Needed:
  * STVCLAS
  * STVTERM

## Questions for HR:
  * Form approvals:
    - if submitter is not in dept approval group, should it go?
    - what if approver is in two sequential groups, (denise nawroki) 3 313, 3 000 - yes skip.
  * When reviewing (i.e. approver) hide tabs other than review and comments?
  * Review Transaction Codes
  * Employment -> Salary Tab: Addl Salary and Split Assignment - should fields be required?  If so, which?