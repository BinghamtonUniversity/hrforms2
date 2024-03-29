<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class FormList extends HRForms2 {
	private $_arr = array();

	function __construct($req,$rjson=true) {
		$this->allowedMethods = "GET"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
		$this->reqAuth = true; //default: true - NB: See note above
		$this->retJSON = $rjson;
		$this->req = $req;
		$this->init();
	}

	/**
	 * validate called from init()
	 */
	function validate() {
		if (!isset($this->req[0])) $this->raiseError(E_BAD_REQUEST);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
		// drafts:
		switch($this->req[0]) {
			case "drafts":
				$qry = "select suny_id, unix_ts, drafts.data.formId as FORM_ID, 
                    drafts.data.effDate,
                    nvl(drafts.data.person.information.ALIAS_FIRST_NAME,drafts.data.person.information.LEGAL_FIRST_NAME) as FIRST_NAME,
                    drafts.data.person.information.LEGAL_MIDDLE_NAME as LEGAL_MIDDLE_NAME,
                    drafts.data.person.information.LEGAL_LAST_NAME as LEGAL_LAST_NAME,
                    drafts.data.formActions.formCode.FORM_CODE as FORM_CODE,
                    drafts.data.formActions.formCode.FORM_TITLE as FORM_TITLE,
                    drafts.data.formActions.actionCode.ACTION_CODE as ACTION_CODE,
                    drafts.data.formActions.actionCodeTitle.ACTION_TITLE as ACTION_TITLE,
                    drafts.data.formActions.transactionCode.TRANSACTION_CODE as TRANSACTION_CODE,
                    drafts.data.formActions.transactionCode.TRANSACTION_TITLE as TRANSACTION_TITLE,
                    drafts.data.payroll.PAYROLL_CODE as PAYROLL_CODE,
                    drafts.data.payroll.PAYROLL_TITLE as PAYROLL_TITLE,
                    drafts.data.payroll.PAYROLL_DESCRIPTION as PAYROLL_DESCRIPTION,
                    drafts.data.employment.position.positionDetails.LINE_NUMBER as LINE_NUMBER,
                    drafts.data.employment.position.positionDetails.TITLE as TITLE,
                    '0' as sequence, ' ' as groups, ' ' as journal_status
				from hrforms2_forms_drafts drafts 
                where suny_id = :suny_id";
				break;

			case "approvals": 
				$qry = "select f.form_id, f.created_by.SUNY_ID as created_by_suny_id, 
				to_char(f.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				f.form_data.effDate,
				nvl(f.form_data.person.information.ALIAS_FIRST_NAME,f.form_data.person.information.LEGAL_FIRST_NAME) as FIRST_NAME,
				f.form_data.person.information.LEGAL_MIDDLE_NAME as LEGAL_MIDDLE_NAME,
				f.form_data.person.information.LEGAL_LAST_NAME as LEGAL_LAST_NAME,
				f.form_data.formActions.formCode.FORM_CODE as FORM_CODE,
				f.form_data.formActions.formCode.FORM_TITLE as FORM_TITLE,
				f.form_data.formActions.actionCode.ACTION_CODE as ACTION_CODE,
				f.form_data.formActions.actionCodeTitle.ACTION_TITLE as ACTION_TITLE,
				f.form_data.formActions.transactionCode.TRANSACTION_CODE as TRANSACTION_CODE,
				f.form_data.formActions.transactionCode.TRANSACTION_TITLE as TRANSACTION_TITLE,
				f.form_data.payroll.PAYROLL_CODE as PAYROLL_CODE,
				f.form_data.payroll.PAYROLL_TITLE as PAYROLL_TITLE,
				f.form_data.payroll.PAYROLL_DESCRIPTION as PAYROLL_DESCRIPTION,
				f.form_data.employment.position.positionDetails.LINE_NUMBER as LINE_NUMBER,
				f.form_data.employment.position.positionDetails.TITLE as TITLE,
				nvl(f.created_by.ALIAS_FIRST_NAME,f.created_by.LEGAL_FIRST_NAME) as created_by_first_name, 
				f.created_by.LEGAL_LAST_NAME as created_by_legal_last_name,
				j.status, j.sequence, f.form_data.GROUPS, js.journal_status,
				to_char(js.max_journal_date,'DD-MON-YYYY HH24:MI:SS') as max_journal_date
				from hrforms2_forms f,
				(select jf2.* from (select jf1.*,
					rank() over (partition by jf1.form_id order by jf1.journal_date desc) as rnk
					from hrforms2_forms_journal jf1
				) jf2
				where jf2.rnk = 1 and jf2.status = 'PA' and
				jf2.group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)) j
				left join (select form_id, max(journal_date) as max_journal_date, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_forms_journal group by form_id) js on (js.form_id = j.form_id)
				where f.form_id = j.form_id
				and f.created_by.SUNY_ID != :suny_id";
				break;
	
			case "pending":
				$qry = "select f.form_id, f.created_by.SUNY_ID as created_by_suny_id, 
				to_char(f.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				f.form_data.effDate,
				nvl(f.form_data.person.information.ALIAS_FIRST_NAME,f.form_data.person.information.LEGAL_FIRST_NAME) as FIRST_NAME,
				f.form_data.person.information.LEGAL_MIDDLE_NAME as LEGAL_MIDDLE_NAME,
				f.form_data.person.information.LEGAL_LAST_NAME as LEGAL_LAST_NAME,
				f.form_data.formActions.formCode.FORM_CODE as FORM_CODE,
				f.form_data.formActions.formCode.FORM_TITLE as FORM_TITLE,
				f.form_data.formActions.actionCode.ACTION_CODE as ACTION_CODE,
				f.form_data.formActions.actionCodeTitle.ACTION_TITLE as ACTION_TITLE,
				f.form_data.formActions.transactionCode.TRANSACTION_CODE as TRANSACTION_CODE,
				f.form_data.formActions.transactionCode.TRANSACTION_TITLE as TRANSACTION_TITLE,
				f.form_data.payroll.PAYROLL_CODE as PAYROLL_CODE,
				f.form_data.payroll.PAYROLL_TITLE as PAYROLL_TITLE,
				f.form_data.payroll.PAYROLL_DESCRIPTION as PAYROLL_DESCRIPTION,
				f.form_data.employment.position.positionDetails.LINE_NUMBER as LINE_NUMBER,
				f.form_data.employment.position.positionDetails.TITLE as TITLE,
				nvl(f.created_by.ALIAS_FIRST_NAME,f.created_by.LEGAL_FIRST_NAME) as created_by_first_name, 
				f.created_by.LEGAL_LAST_NAME as created_by_legal_last_name,
				j.status, j.sequence, f.form_data.GROUPS, js.journal_status,
				to_char(js.max_journal_date,'DD-MON-YYYY HH24:MI:SS') as max_journal_date
                from hrforms2_forms f,
				(select jf2.* from (select jf1.*,
					rank() over (partition by jf1.form_id order by jf1.sequence desc) as rnk
					from hrforms2_forms_journal jf1
					where jf1.form_id in (select form_id from hrforms2_forms_journal where suny_id = :suny_id and status = 'S')) jf2
				where jf2.rnk = 1 and jf2.status in ('PA','PF')) j
				left join (select form_id, max(journal_date) as max_journal_date, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_forms_journal where sequence >= 0 group by form_id) js on (js.form_id = j.form_id)
				where f.form_id = j.form_id";
				break;
			
			case "rejections":
				$qry = "select f.form_id, f.created_by.SUNY_ID as created_by_suny_id, 
				to_char(f.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				f.form_data.effDate,
				f.form_data.person.information.FIRST_NAME as FIRST_NAME,
				f.form_data.person.information.LEGAL_MIDDLE_NAME as LEGAL_MIDDLE_NAME,
				f.form_data.person.information.LEGAL_LAST_NAME as LEGAL_LAST_NAME,
				f.form_data.formActions.formCode.FORM_CODE as FORM_CODE,
				f.form_data.formActions.formCode.FORM_TITLE as FORM_TITLE,
				f.form_data.formActions.actionCode.ACTION_CODE as ACTION_CODE,
				f.form_data.formActions.actionCodeTitle.ACTION_TITLE as ACTION_TITLE,
				f.form_data.formActions.transactionCode.TRANSACTION_CODE as TRANSACTION_CODE,
				f.form_data.formActions.transactionCode.TRANSACTION_TITLE as TRANSACTION_TITLE,
				f.form_data.payroll.PAYROLL_CODE as PAYROLL_CODE,
				f.form_data.payroll.PAYROLL_TITLE as PAYROLL_TITLE,
				f.form_data.payroll.PAYROLL_DESCRIPTION as PAYROLL_DESCRIPTION,
				f.form_data.employment.position.positionDetails.LINE_NUMBER as LINE_NUMBER,
				f.form_data.employment.position.positionDetails.TITLE as TITLE,
				nvl(f.created_by.ALIAS_FIRST_NAME,f.created_by.LEGAL_FIRST_NAME) as created_by_first_name, 
				f.created_by.LEGAL_LAST_NAME as created_by_legal_last_name, 
				j.status, j.sequence, f.form_data.GROUPS, js.journal_status,
				to_char(js.max_journal_date,'DD-MON-YYYY HH24:MI:SS') as max_journal_date
				from hrforms2_forms f,
				(select jf2.* from (select jf1.*,
					rank() over (partition by jf1.form_id order by jf1.journal_date desc) as rnk
					from hrforms2_forms_journal jf1
					where jf1.form_id in (select form_id from hrforms2_forms_journal where suny_id = :suny_id and status = 'S')) jf2
				where jf2.rnk = 1 and jf2.status = 'R') j
				left join (select form_id, max(journal_date) as max_journal_date, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_forms_journal group by form_id) js on (js.form_id = j.form_id)
				where f.form_id = j.form_id
				and f.created_by.SUNY_ID = :suny_id";
				break;

			case "final":
				$qry = "select f.form_id, f.created_by.SUNY_ID as created_by_suny_id, 
				to_char(f.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				f.form_data.effDate,
				f.form_data.person.information.FIRST_NAME as FIRST_NAME,
				f.form_data.person.information.LEGAL_MIDDLE_NAME as LEGAL_MIDDLE_NAME,
				f.form_data.person.information.LEGAL_LAST_NAME as LEGAL_LAST_NAME,
				f.form_data.formActions.formCode.FORM_CODE as FORM_CODE,
				f.form_data.formActions.formCode.FORM_TITLE as FORM_TITLE,
				f.form_data.formActions.actionCode.ACTION_CODE as ACTION_CODE,
				f.form_data.formActions.actionCodeTitle.ACTION_TITLE as ACTION_TITLE,
				f.form_data.formActions.transactionCode.TRANSACTION_CODE as TRANSACTION_CODE,
				f.form_data.formActions.transactionCode.TRANSACTION_TITLE as TRANSACTION_TITLE,
				f.form_data.payroll.PAYROLL_CODE as PAYROLL_CODE,
				f.form_data.payroll.PAYROLL_TITLE as PAYROLL_TITLE,
				f.form_data.payroll.PAYROLL_DESCRIPTION as PAYROLL_DESCRIPTION,
				f.form_data.employment.position.positionDetails.LINE_NUMBER as LINE_NUMBER,
				f.form_data.employment.position.positionDetails.TITLE as TITLE,
				nvl(f.created_by.ALIAS_FIRST_NAME,f.created_by.LEGAL_FIRST_NAME) as created_by_first_name, 
				f.created_by.LEGAL_LAST_NAME as created_by_legal_last_name, 
				j.status, j.sequence, f.form_data.GROUPS, js.journal_status,
				to_char(js.max_journal_date,'DD-MON-YYYY HH24:MI:SS') as max_journal_date
				from hrforms2_forms f,
				(select jf2.* from (select jf1.*,
					rank() over (partition by jf1.form_id order by jf1.journal_date desc) as rnk
					from hrforms2_forms_journal jf1
				) jf2
				where jf2.rnk = 1 and jf2.status = 'PF' and
				jf2.group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)) j
				left join (select form_id, max(journal_date) as max_journal_date, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_forms_journal group by form_id) js on (js.form_id = j.form_id)
				where f.form_id = j.form_id
				and f.created_by.SUNY_ID != :suny_id";
				break;

			case "archived":
				$qry = "select f.form_id, f.created_by.SUNY_ID as created_by_suny_id, 
				to_char(f.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				f.form_data.effDate,
				f.form_data.person.information.FIRST_NAME as FIRST_NAME,
				f.form_data.person.information.LEGAL_MIDDLE_NAME as LEGAL_MIDDLE_NAME,
				f.form_data.person.information.LEGAL_LAST_NAME as LEGAL_LAST_NAME,
				f.form_data.formActions.formCode.FORM_CODE as FORM_CODE,
				f.form_data.formActions.formCode.FORM_TITLE as FORM_TITLE,
				f.form_data.formActions.actionCode.ACTION_CODE as ACTION_CODE,
				f.form_data.formActions.actionCodeTitle.ACTION_TITLE as ACTION_TITLE,
				f.form_data.formActions.transactionCode.TRANSACTION_CODE as TRANSACTION_CODE,
				f.form_data.formActions.transactionCode.TRANSACTION_TITLE as TRANSACTION_TITLE,
				f.form_data.payroll.PAYROLL_CODE as PAYROLL_CODE,
				f.form_data.payroll.PAYROLL_TITLE as PAYROLL_TITLE,
				f.form_data.payroll.PAYROLL_DESCRIPTION as PAYROLL_DESCRIPTION,
				f.form_data.employment.position.positionDetails.LINE_NUMBER as LINE_NUMBER,
				f.form_data.employment.position.positionDetails.TITLE as TITLE,
				nvl(f.created_by.ALIAS_FIRST_NAME,f.created_by.LEGAL_FIRST_NAME) as created_by_first_name, 
				f.created_by.LEGAL_LAST_NAME as created_by_legal_last_name, 
				j.status, j.sequence, f.form_data.GROUPS, js.journal_status,
				to_char(js.max_journal_date,'DD-MON-YYYY HH24:MI:SS') as max_journal_date
				from hrforms2_forms_archive f,
				(select jf2.* from (select jf1.*,
					rank() over (partition by jf1.form_id order by jf1.journal_date desc) as rnk
					from hrforms2_forms_journal_archive jf1
				) jf2
				where jf2.rnk = 1 and jf2.status = 'Z') j
				left join (select form_id, max(journal_date) as max_journal_date, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_forms_journal_archive group by form_id) js on (js.form_id = j.form_id)
				where f.form_id = j.form_id
				and f.created_by.SUNY_ID = :suny_id";
				break;

			default:
				$this->raiseError(E_BAD_REQUEST);
		}
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
		oci_execute($stmt);
		while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
			$row['STATUS_ARRAY'] = explode(",",$row['JOURNAL_STATUS']);
			if ($this->req[0] == 'drafts') {
				$row['MAX_JOURNAL_DATE'] = date('Y-m-d H:i:s',$row['MAX_JOURNAL_DATE']);
			}
			$this->_arr[] = $row;
		}
		if ($this->req[0] == 'archived') {
			foreach ($this->_arr as &$line) {
				$line['GROUPS_ARRAY'] = array();
				$qry = "select sequence, rank, group_id, group_name, group_description
					from hrforms2_forms_journal_archive j,
					(
						select dense_rank() over (partition by group_id order by history_date asc) rank, g2.*
						from (
							select g.*, null as method, sysdate as history_date from hrforms2_groups g
							union 
							select * from hrforms2_groups_history
						) g2
					) grp 
					where form_id = :id
					and grp.group_id = j.group_to
					and grp.history_date >= j.journal_date
					order by journal_date, sequence, rank";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":id",$line['FORM_ID']);
				oci_execute($stmt);
				$last_seq = null;
				while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
					if ($last_seq == $row['SEQUENCE']) continue;
					array_push($line['GROUPS_ARRAY'],array(
						"GROUP_ID"=>$row['GROUP_ID'],
						"GROUP_NAME"=>$row['GROUP_NAME'],
						"GROUP_DESCRIPTION"=>$row['GROUP_DESCRIPTION']
					));
					$last_seq = $row['SEQUENCE'];
				}
			}
		}
		oci_free_statement($stmt);
		$this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
}
