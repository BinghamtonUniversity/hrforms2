# TODO List

try removing the Promise.race in q() and see what happens when it takes too long.

## Bug Fix:
  * Paytrans not using paged loading off campus.  Need to test this more.  In general switch to paged loading if first attempt takes too long (probably future enhancement).
  * Email fields for Archived not showing; need to pull from archive instead of "inprogress" table.


## Test:* SGRIILLS showing as "ERR: DUPLICATE IDs" on email notification in old HR Forms PR request.


## In Progress Tasks:
  * Search for "TODO" in files
  * Change delete modals to component: ModalConfirm
  * Consolidate Title/Text of modals/confirmations - use config
  
## Tasks: 
  * Make comments available to email
  * Add option to send to all approval groups in email settings
  * Add "initialData" value to query options and remove checked form !data. Caveat: setting initialData will set the query status to successful.
  * Account Numbers: do we need to include the Fiscal Year?
  * Change "onChange" handlers to use useCallBack (see paytrans.js) - performance improvement

## Upgrades:
  * Upgrade to React 18/19?
  * Upgrade to Bootstrap v5
  * Upgrade to React Query v4/5? (TanStack Query)
  * Upgrade to React Router v6
  * run: npm outdated; npm update <package>

## Future Enhancements
  * In Admin|Form Transactions, give option to cascade inactivation.
  * When workflow is changed need to check journal to make sure we change existing?  There could be issues when removing a step if it's already completed.
  * DataTables: Add search-by-field as needed (see groups.js)
  * Forms Hierarchy: Group Form Codes to consolidate "duplicated" records.
  * Create Admin Panel to show counts of ALL new requests, forms, etc.
    * New in last 24 hours, New in last 7 days, New in last 14 days, new in last 28 days, total active, total archived
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
  * Custom context (right-click) menu (https://fkhadra.github.io/react-contexify/)
  * Allow global configuration of DatePicker dateFormat
  * Allow upload of data to Admin Lists
  * CountryCode -> "State" translation interface needed (see education.php)
  * Add ability to resend email to groups for PR or Form
  * Lists should use useFormContext() - need to clean up page.
  * Add ability to selectively search columns on the hierarchy. (e.g. only show specific PosType), Only show specific WFIDs
  * Look into using i18n-next for label/title text

### Hierarchy/Workflow: 
  * In theory all the hierarchy, workflow, and tab information is stored, so the paytrans could be delete.
  * PF will go right to Z (Archived)
  * There will be no "F" (Final Approved)
  * Future enhancement will add in batch option to send to SUNY
    * PF -> BP (Batch Pending)
    * if Batch is successful BP -> Z
    * if Batch has error BP -> BE (Batch Error)
