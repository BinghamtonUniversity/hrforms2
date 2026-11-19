# Bug Report
B00989940 - multiple commitments
B01176851 - multiple assignments
Delete/Undelete testing: Request 274, Form 622
Archive/Unarchive testing: 

## 2026-10-01:
user with future end date is made inactive, should not
cannot impersonate inactive user; how can we do this?


## 2026-08-20:
Forms in the "in progress" tables that have a "Z" status and an "F" status (this is not a valid status, not sure where it came from)
2120,2079,5920
DONE: PAY/new pay; don't limit number of rows/records
[FIXED/TESTING]Routing uses reporting dept rather than position dept.  eg. Nicole Barren.  IGMAP going to supervisor Dept (Matt Pensky)
  - Form: 4974, 4978, 4979
  - field name like: DPT_CMP...
  - changes to user.php and forms.php


## 2026-08-18:
DONE: Inconsistent titles in tables; Submitted By vs Created By (difference between in-process vs archived)


## 2026-07-30
DONE: Undelete keeps comment on Rejected.  Need to separate R and D
DONE: PR: 854 - holds comment.  Z comment is not same and displayed comments (above table)

## 2026-07-02
[FOLLOWUP]: ReqID 888: skipped incorrectly.
DONE: can we jump from hierarchy to workflow - yes
DONE: jump from journal to hierarchy or workflow - yes


## 2026-05-18:
disable CC when no mail to checked
disable reply to when none checked
DONE: put deletes in archive
viewer:
  [DONE]add journal
  [DONE]add archive
  can we send emails that submitter gets


## 2026-05-14:
DONE: Can we conditionally hide Salary in the email templates; yes {{#field}}...{{/field}}


## 2026-05-07:
FIXED: FORM-Employment|Position: effective date of form should drive the line# position info
  when it populates use eff date; if nothing default to current
  searching does, but pre-pop does not
  if users clear and then search it is correct

DONE: PR review page; add New Candidate info heading


## 2026-04-30:
FIXED?: B01103746: EF-PAY_SIC; Salary tab; pay rate is old/incorrect.  Check sort order (SUNY ID: 2002571173)

FIXED: B00948441: EF-HIR-ASU; Salary showing empty additional salary (BNP type, but not display) - not in additional salary list don't show

FIXED: Archive form 994 only searchable by form id; no other fields are working.

DONE: PR need to be able to change Effective Date on Basic Info page.

## 2026-04-07:
FIXED: email not working in prod

FIXED: person|education acting odd, typing OHIO? State?

DONE: "Stuck" forms: 1118,1504 (can be deleted)


## 2026-03-20:
FIXED: Hierarchy workflow in archive is showing wrong order of boxes.  Need to check on sorting for journal.

DONE: Add external ID to review

DONE: Address "wish list"

DONE: Add popover for future emploment: B01176851 (shows future, should current and popover future)


## 2026-03-17:
[LOW]Changed hierarchy (adding approval group) causes the conditional to not work.
 - skip may be using current instead of history

DONE: Create popover for department in person lookup to show multiple commitments for students;
use group id 1930  = Trio, 1012 = CLT - in support tables, campus department, campus identifier

Update HR Forms 1 in progress lists


## 2026-03-10:
FIXED: created by/updated by not working for non-admin.
  
DONE: last updated; include time  

DONE: PR: Expenditure Type needs to be required and formatting fixed

FIXED: PR when changing Pos Type clear Req Type and Eff Date?
  CONFIRMED: Req Type and Eff Date not clearing.

DONE: can we redirect to archive when clicking on old inprogess URL link

DONE: Group to allow unarchive

DONE: add handshake id # to Pay tab; not reqd


## Disable New PR/Form creation in HR Forms 1:
update hrforms_group_privs
set end_date = trunc(sysdate)
where priv_id in ('2','8') and
groupname not in ('ADMIN','HR');

## 2026-03-02:
DONE: get list of in process hrf1 form and requests; views!

DONE: check for RR in code, remove from DB in DEV; only in DB in DEV.

DONE: check for empty form data in PROD; no empty dataforge

## 2026-02-18:
DONE: EF-PLA should have leave percentage; see form config for partial leave
  - remove conditionals on leave pct

DONE: PROD: form 684; not showing term duration period (i.e. days, weeks, etc.) - see archive view
      DEV: from 652

In process transactions in HR Forms 1?  Will it break when orgs are changed? Yes.

New Go Live Date: 3/3/2026

## 2026-01-28:
FIXED: Form rejections keeping comment and not updating on resubmit

## 2026-01-27:
FIXED: PR 232 in prod is not in apporvals for Lisa G - should be.
  - this is because there is only one person (Lisa G) in the PR_WATSON group.  Logic does not allow person submitting the form to approve their own form.


## 2026-01-06:
Feb 19, 2026 
Vicki is out 2 weeks after Jan 19, plus staff loss

DONE: make borders on print solid black

DONE: "back" button from form/request view when coming from list or journal search

CANNOT REPLICATE: check line number 423, 457 not being maintained when using current role, but changing line #
new:43017 (old:05153)
B01100487
EF-POS-PRM

(DONE+) Template Replacement Vars:
  - submitted by name
  - url to form/pr
  - empl name or candidate name
  - B#

## 2025-12-09:
DONE: install v2.0.1 and configure email service

FIXED: ghost forms for Kathy G; due to Joe T issue? not ghost forms, the count was including "R" status when it shouldn't due to incorrect AND/OR logic

Archive: add updated by and last updated date to table; add updated by to the search
  look at hiding fields in table with datatables

FIXED: FORM 434 (three committements showing up; should be one)

DONE: Exclude departments that start with "X" in deptOrgs list

PR: Enter line numbers in field in comma sep format

DONE: PR: swap B# and candidate name order

Template Replacement Vars:
  - submitted by name
  - url to form/pr
  - empl name or candidate name
  - B#


## 2025-11-19:
FIXED: Check user notifications; set/unset and see if it updates.

DONE: duration, tentative end date only req for temp/term

DONE: PR req; ask for #

NO ISSUE: sep-ter-ret not showing position info on review (Jeanne Weber); wrong role selected - selected RETRE

DONE:confirm approve modal for PR and Forms

duplicate form alert; is it considering the current draft??

FIXED: approver adds comment, saves and exits, comment is not saved


## 2025-11-11:
HR Forms 1.x: (skip fix, move to HRF2)
  PR 28949, missing budget title on review; PR is archived
  PR 29040, missing end date


## 2025-11-07:
Test new curr/prev employee in request - adding a new selection; blur needed
review printing format for requests; vm is setting 84% for printing
FIXED: Forms: verify that email is required - did not error in test


## 2025-11-03:
DONE: need to export DB, missing the new list
DONE: Requests: backfill; mark previous/current required.
DONE: Request: switch from new to backfill; strata id required is still showing.  Does clear on review tab, but can we clear errors when switching on info page.
FIXED: Internal error on expander with forms.


## 2025-09-30
DONE: Add info box on Pending lists to indicate requests/forms shown include ones in which you are in an approval group and may not have been submitted by you or require any current action.

FIXED: REQ 251 (Rejected) should not show after rejection.  Was created by Keriann; also was able to edit and delete even though not creator. - not accounting for rejected

DONE: In approvals prevent changes on existing data for Person -> Information allow new data only (i.e. blank fields only)

FIXED: Bug: Request Org Name required does not show in error box.

## 2025-09-22
DONE: PR archive - add title to search

PARTIAL: Requests, workflow expander not showing skipped correctly until after skipped
VERIFIED: Verify groups are correct in all locations (wf, request_data, display on list, etc.)

DONE: PR - need to incidate required fields (Vicki will provide reqd fields)

DONE: Archive search - hijack back button to open search criteria/results

##
CAS fixes:

CASConfig:
```
$phpcas_path = '../vendor/apereo/phpcas/';
$cas_context = '/idp/profile/cas';
$client_service_name = 'https://'.HOST;
```
Be sure to set CAS_HOST in config.php

## 2025-09-16
CANNOT REPLICATE: jpelitier - draft submit fails (CLOB issue)


## 2025-09-09
DONE: Form 523
Jennifer Nepa

Rule: Submitter of form can delete, only if rejected


## 2025-07-29:
IN PROGRESS: Form -> Form Journal -> Form ID: 500 -> view: receive 403 error (as vm)
  All users in the workflow - even "upstream" should be able to view/journal query

FIXED: Salary Effective showing wrong on Review
  B00838887
  28029-EF-PAY-SIC (sal inc)

Cannot Replicate: Form draft; click menu item and discard - discard doesn't work


## 2025-07-22:
DONE: Form Review: Employment Data -> Position box
  show always for 28020, 28029
  other tabs determine by what tabs are shown/checked
  see form 498 for example


FIXED: PayTrans; PR Required re-checking
  28021-EF-CCH-SDT
  Uncheck -> save -> review -> save (rechecks)
  00000, 28021, 28023, 28029: should not have PR Req'd


## 2025-06-26:
DONE: PRs should route based on position not submitter

FIXED: Forms contacts needs to show First Name and Last Name labels


## 2025-06-10:
FIXED: Forms: Position: Search for line, fill out info, leave, come back.  Does it still have info.  Use GA/TA payroll, line number: 92000

FIXED: Forms: New Role focuses on Eff Date instead of Payroll.

FIXED: Forms - Salary: # payments and salary rate showing as required even when filled in.  Seems to be BIW pay basis

FIXED:
Req 224: comments carrying forward?
Request rejection, default comment placeholder not being replaced (see REQ 223 and 224)

FIXED: Kristen made changes to funding on REQ approval, but did not save

DONE: Archive search; add past/future radio; change day buttons to: 30, 60, 90, 180

NO ISSUE FOUND: Form Review: Check Mail Drop field

COULD NOT REPLICATE: Draft limit needs to use effective user only; Holly hit limit impersonating Jon Roma.  He has 4, she has 6

---
DONE:
In Form View: display form type description instead of code

DONE:
form/request view: show user who is viewing/printing under submitter information

DONE:
HR would like a list to track all forms that are in progress (see My Forms in old forms)
even after approvals should still be able to to see the form on it's path

FIXED:
EF - HIR - SUM
Position: populate line number via popup box and toggle, the info box (blue) is out of state sync

DONE:
Fix accordion Archive titles to differentiate Forms/Requests

FIXED:
Laura McDuffee; Archive Search not finding
Req: 217; missing approvers and submitter
Form 428; 28020 EF HR SUM

FIXED:
Lorrie Hagerman; draft form: required field "rate" not shown in forms.

FIXED:
Req 216 as nancy b
tried to reject - error
<br/><b>Warning</b>:  OCI-Lob::save(): OCI_INVALID_HANDLE in <b>/u01/app/badm/user_projects.ha/dev/hrforms2/www/api/classes/journal.php</b> on line <b>232</b><br/>{
    "journal": {
        "status": "R",
        "request_id": 216,
        "hierarchy_id": "7",
        "workflow_id": "7",



---
FIXED:
Check order of comments history in Forms and Requests
  - request: asc/desc???
  - form: desc
  - archive request:desc
  - archive form: desc

FIXED:
Salary increase for Tim C (B00505893); causes form loading to loop.  Error on form.js:510
  - form submitted as mdold

FIXED:
Form ID 399, archived duplicate

CHANGED:
Archive search: Effective Date to "Transaction Effective Date"


FIXED:
Form ID: 402; comments carrying forward from auto-approve and groups are wrong in comment history.
Form ID: 405; groups wrong


FIXED - problem with worflow config:
Req 206 should have skipped, but did not.
  - cannot final approve; error
req 205 skipped correctly - same as 206
req 207; difr account and skipped


---
FIXED:
PR workflow skip not working

FIXED:
PR: final approve #190; unique constraint violated for HRF2_REQ_ARCH_PK
may not be removing on FA from "in-prog" table.  190 is in both Archive and In-Progress

FIXED:
Form 382 submitted by Shawne not showing in archive search by ID

NO BUG: only missing for Scott G's B.S. and it is not in the data feed.
education not pre-populating the Program/Major field

NOTE: only degree program in the data feeds and tables.  program sub-group not included.
ADDED: Added degree specialization as a "local" field.
degree program/major == degree program group (SUNYHR)
+(add)degree specialization (not req) == program sub-group

FIXED:
Meg Trembly is missing HR Final Approval; she is part of HR group.

FIXED:
Extra service form -requiring SUNY Account: EF-PAY-ExtraService - B00536620

Archive search triggering twice

---
FIXED:
Unicode characters are allowed - need to prevent this.

FIXED:
PR Comments erroring in Archive view.  REQUEST_ID is null.

FIXED:
Forms Archive View broken: 500 error

DONE:
PR - search for multi-lines

DONE:
Visa Types only required when non-citizen with visa (FORMS)

DONE:
28029 should default to benefits eligible (code T)

----
FIXED:
Archived list item missing

FIXED:
check submit PR request.js:307 (error unexpected token)
  - impersonate vicki

DONE; TESTING:
only require home email for EF-HIR-* EF-PAY-Appoint*
  - home cannot be @binghamton.edu

FIXED:
Salary tab, hide #pmt, rate, SUNY acct when 
  - summer, winter, extra service (SUM,WIN,EXS)

FIXED:
Form not submitting, no error, is there an early return?

CANNOT REPLICATE:
http://hrforms2.localhost/api/api.php/employmentinfo/1516586/salary - hangs; working now - cannot replicate

NOTHING OBVIOUS:
28020 - DF - DTA - TTL, rechecking require PR

FIXED:
salary tab: effective should be from basic info

NEED MORE INFO: (what form)
appt tab, cont perm date showing hidden even when it shouldn't
vicki does not have show/hide hidden toggle

FIXED:
gray box, only showing last name... need "name" instead of first_name

FIXED: No tabs defined for transactions.  Added error notifications on Basic Info
B00078324
EF-Paid Leave-Full - cannot next
transaction codes: EDF, SLL

----

FIXED:
PR: 125
Wendy Brightsen
2 304

FIXED:
only require home email for 28020

FIXED: B00697531: check campus address building dropdown

FIXED:
B00435458
28020
EF PC PROM
also date issue (see below)


FIXED: HR Final showing on all users; should not.
FIXED: Approvals also showing up.

--
can we update dev - BUHR
what banner instance does BTEST point to?

FIXED:
B00980718
EF-PAY-EXS
No suny acct on salary
- date issue?
check begin date and make sure eff date is after. future and current both are good

NO FIX:
eff date calendar pop-up close on date pick (not sure - can't fix)

go-live 4/14?

test new volunteer role on Graziano 12/16/1984 (not in bandev; find record with no b#?)
They don't have B# and HR Forms fails when selecting a "new role"

---
++Fix server issue for archive forms search
+Pending Form View need Close/Quit button
+ Add close button on Requests also
++Final Approvals pulling Last Name and Middle Name
*check for duplicate forms
+print font very small
++Fix salary/rate query; do not consider dates

-- 
Fixed:
Last Name: Liu
DOB: 9/11/2006
New Empl 28021
DOB shows, but when going to next fires validation error

--

====

Position of popovers is wrong... showing in the upper left.

FIXED: difference is PHP version
B#01038964
28029 EF-HIR-APU
check campus address dropdowns

FIXED:Discard form not working when form not saved

FIXED: Incorrect comparison operator in query.  BIW not included
B#00972261
28029 EF-HIR-extra service
employment -> salary tab
# payments not pulling in
account number not pulling in
see salary.php - fee and biw should get # pmts

HRP_ID: 944902
http://hrforms2.localhost/api/api.php/employmentinfo/944902/salary
missing full time rate amount on sal tab


Use this for notes about bugs

  * TEST FORM: When person has no IDs (in prod: Keisha Wint, DOB: 8/23/1974)
    - Updated: 11/19/2024; no errors resulting now.  Probably fixed queries with other bug fixes.
    - Mostly works, some errors with origSalary, but may be moot because of using TEST form code.

Permissions error for SUNY_ID: 731475

B00980488
EF - POS - CHL
line: 01138
benefits (POS Tab) incorrect
appt details on APT tab not filling in
salary info not filling in
not showing addl salary (also receives)

-------
B00170309
EF-PAY-SIC
not pulling in line number/position info and salary info
-- since salary tab also used position info need to pull that if not already being pulled

B01094073
EF-HIR-SUM
line #: 18501
+DOB/Demo data not showing up; query restricted by role end date and role_type <> 'STSCH', can we drop this?
+Review: Salary box not showing all fields; eff date, pay basis, percent
+Review: Position, benefits not showing (could not reproduce - cache?)

Bxxx
New Role: 28020
EF-HIR-??
line #: 18200
Test split pay; pct box "wonky"

B00673016
EF-POS-PRM
existing role
line #: 00848
no line # pulled in (cannot reproduce - cache?)
