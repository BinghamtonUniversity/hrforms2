# TODO List
Bug fixes, enhancements and things still to complete.

## Bug Fix:
 * TabRouters are wrong; need to use React.memo and send ACTIVE tab, not tab.  If tab is sent all tabs are generated on load rather than only the active one.
 * Add "id" key for all DataTables or use keyField parameter on table
 * SGRIILLS showing as "ERR: DUPLICATE IDs" on email notification in old HR Forms PR request.

## In Progress Tasks:
 * Add progressPending to DataTables
 * Switch delete modals to component: ModalConfirm
 * "globalize" icons (e.g. the "save" icon should be the same for all; this may be making buttons a component)
 * Use table partitioning for managing requests and forms (see: https://docs.oracle.com/en/database/oracle/oracle-database/12.2/vldbg/partition-create-tables-indexes.html)

## Tasks: 
 * Ability to download user list for auditing
 * Admin Lists: 
   * invalidate queries when list data in changed
   * make list data an l/v pair
 * Delete paytrans should check to see usage?
 * Switch from username to B# as primary key
 * Header styling needed; i.e. h1, h2, h3, etc.
 * Email notification
 * User should NOT be able to approve/reject requests they submitted.
 * Remove last group from skip select list - cannot skip the last one.  Need to handle when changed.
 * Use Helmet to change the title of the page
 * When reviewing (i.e. approver) hide tabs other than review and comments?
 * Add default routing in settings
 * User should show dept and associated group
 * On app error allow "reset"; test with undefined import component.

## Upgrades:
 * Upgrade to Bootstrap v5
 * Upgrade to React Query v4
 * Upgrade to React Router v6

## Future Enhancements
 * Allow global configuration of DatePicker dateFormat
 * Allow upload of data to Admin Lists
 * CountryCode -> "State" tranlation interface needed (see education.php)
 * Add ability to resend email to groups for PR or Form
 * Lists should use useFormContext() - need to clean up page.
 * Add ability to selectively search columns on the hierarchy. (e.g. only show specific PosType), Only show specific WFIDs)

