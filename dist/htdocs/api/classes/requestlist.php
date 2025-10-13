<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class RequestList extends HRForms2 {
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
				$qry = "select suny_id, unix_ts, drafts.data.reqId as REQUEST_ID, 
				drafts.data.posType, drafts.data.reqType, drafts.data.effDate, drafts.data.candidateName, 
				drafts.data.lineNumber, drafts.data.reqBudgetTitle.title,
				'draft' as status, '0' as sequence, ' ' as groups, ' ' as journal_status,
				unix_ts as max_journal_date
				from hrforms2_requests_drafts drafts where suny_id = :suny_id";
				break;

			case "approvals":
				$qry = "select r.request_id, r.created_by.SUNY_ID as created_by_suny_id, 
				to_char(r.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				r.request_data.posType, r.request_data.reqType, r.request_data.effDate, r.request_data.candidateName,
				r.request_data.lineNumber, r.request_data.reqBudgetTitle.title,
				r.created_by.LEGAL_FIRST_NAME, r.created_by.LEGAL_LAST_NAME, r.created_by.ALIAS_FIRST_NAME,
				j.status, j.sequence, r.request_data.WORKFLOW_ID, r.request_data.GROUPS, js.journal_status, 
				to_char(js.max_journal_date,'DD-MON-YYYY HH24:MI:SS') as max_journal_date
				from hrforms2_requests r,
				(select jr2.* from (select jr1.*,
					rank() over (partition by jr1.request_id order by jr1.journal_date desc) as rnk
					from hrforms2_requests_journal jr1
				) jr2
				where jr2.rnk = 1 and jr2.status = 'PA' and
				jr2.group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)) j
				left join (select request_id, max(journal_date) as max_journal_date, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_requests_journal where sequence >= 0 group by request_id) js on (js.request_id = j.request_id)
				where r.request_id = j.request_id
				and r.created_by.SUNY_ID != :suny_id";
				break;
			case "rejections":
				$qry = "select r.request_id, r.created_by.SUNY_ID as created_by_suny_id, 
				to_char(r.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				r.request_data.posType, r.request_data.reqType, r.request_data.effDate, r.request_data.candidateName,
				r.request_data.lineNumber, r.request_data.reqBudgetTitle.title,
				r.created_by.LEGAL_FIRST_NAME, r.created_by.LEGAL_LAST_NAME, r.created_by.ALIAS_FIRST_NAME,
				j.status, j.sequence, r.request_data.WORKFLOW_ID, r.request_data.GROUPS, js.journal_status, 
				to_char(js.max_journal_date,'DD-MON-YYYY HH24:MI:SS') as max_journal_date
				from hrforms2_requests r,
				(select jr2.* from (select jr1.*,
					rank() over (partition by jr1.request_id order by jr1.journal_date desc) as rnk
					from hrforms2_requests_journal jr1
				) jr2
				where jr2.rnk = 1 and jr2.status = 'R') j
				left join (select request_id, max(journal_date) as max_journal_date, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_requests_journal where sequence >= 0 group by request_id) js on (js.request_id = j.request_id)
				where r.request_id = j.request_id
				and r.created_by.SUNY_ID = :suny_id";
				break;
			case "pending":
				$qry = "select r.request_id, r.created_by.SUNY_ID as created_by_suny_id,
				to_char(r.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				r.request_data.posType, r.request_data.reqType, r.request_data.effDate, r.request_data.candidateName,
				r.request_data.lineNumber, r.request_data.reqBudgetTitle.title,
				r.created_by.LEGAL_FIRST_NAME, r.created_by.LEGAL_LAST_NAME, r.created_by.ALIAS_FIRST_NAME,
				j.status, j.sequence, r.request_data.WORKFLOW_ID, r.request_data.GROUPS, js.journal_status, 
				to_char(js.max_journal_date,'DD-MON-YYYY HH24:MI:SS') as max_journal_date
				from hrforms2_requests r,
				(select jr2.* from (
    				select jr1.*, rank() over (partition by jr1.request_id order by jr1.sequence desc) as rnk
    				from hrforms2_requests_journal jr1
    				where jr1.request_id in (select request_id from hrforms2_requests_journal 
        				where (suny_id = :suny_id and status = 'S') or (group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id) and status != 'R')
			    	)) jr2
				where jr2.rnk = 1) j
				left join (select request_id, max(journal_date) as max_journal_date, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_requests_journal where sequence >= 0 group by request_id) js on (js.request_id = j.request_id)
				where r.request_id = j.request_id";
				break;
			case "final":
				$qry = "select r.request_id, r.created_by.SUNY_ID as created_by_suny_id, 
				to_char(r.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				r.request_data.posType, r.request_data.reqType, r.request_data.effDate, r.request_data.candidateName,
				r.request_data.lineNumber, r.request_data.reqBudgetTitle.title,
				r.created_by.LEGAL_FIRST_NAME, r.created_by.LEGAL_LAST_NAME, r.created_by.ALIAS_FIRST_NAME,
				j.status, j.sequence, r.request_data.WORKFLOW_ID, r.request_data.GROUPS, js.journal_status, 
				to_char(js.max_journal_date,'DD-MON-YYYY HH24:MI:SS') as max_journal_date
				from hrforms2_requests r,
				(select jr2.* from (select jr1.*,
					rank() over (partition by jr1.request_id order by jr1.journal_date desc) as rnk
					from hrforms2_requests_journal jr1
				) jr2
				where jr2.rnk = 1 and jr2.status ='PF' and
				jr2.group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)) j
				left join (select request_id, max(journal_date) as max_journal_date, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_requests_journal where sequence >= 0 group by request_id) js on (js.request_id = j.request_id)
				where r.request_id = j.request_id
				and r.created_by.SUNY_ID != :suny_id";
				break;
/*			case "archived":
				$qry = "select r.request_id, r.created_by.SUNY_ID as created_by_suny_id,
				to_char(r.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				r.request_data.posType, r.request_data.reqType, r.request_data.effDate, r.request_data.candidateName,
				r.request_data.lineNumber, r.request_data.reqBudgetTitle.title,
				r.created_by.LEGAL_FIRST_NAME, r.created_by.LEGAL_LAST_NAME, r.created_by.ALIAS_FIRST_NAME,
				j.status, j.sequence, js.journal_groups as groups ,js.journal_status,
				to_char(js.max_journal_date,'DD-MON-YYYY HH24:MI:SS') as max_journal_date
				from hrforms2_requests_archive r,
				(select jr2.* from (select jr1.*,
					rank() over (partition by jr1.request_id order by jr1.journal_date desc) as rnk
					from hrforms2_requests_journal_archive jr1
				) jr2
				where jr2.rnk = 1 and jr2.status ='Z') j
				left join (select request_id, max(journal_date) as max_journal_date, listagg(group_to,',') as journal_groups, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_requests_journal_archive where sequence >= 0 group by request_id) js on (js.request_id = j.request_id)
				where r.request_id = j.request_id
				and r.created_by.SUNY_ID = :suny_id";
				break;
*/
			default:
				$this->raiseError(E_BAD_REQUEST);
		}
		$stmt = oci_parse($this->db,$qry);
		//TESTING: remove for testing:
		//$id = (isset($this->req[1]))?$this->req[1]:$this->sessionData['EFFECTIVE_SUNY_ID'];
		oci_bind_by_name($stmt,":suny_id",$this->sessionData['EFFECTIVE_SUNY_ID']);
		oci_execute($stmt);
		while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
			$row['POSTYPE'] = json_decode($row['POSTYPE']);
			$row['REQTYPE'] = json_decode($row['REQTYPE']);
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
					from hrforms2_requests_journal_archive j,
					(
						select dense_rank() over (partition by group_id order by history_date asc) rank, g2.*
						from (
							select g.*, null as method, sysdate as history_date from hrforms2_groups g
							union 
							select * from hrforms2_groups_history
						) g2
					) grp 
					where request_id = :id
					and grp.group_id = j.group_to
					and grp.history_date >= j.journal_date
					order by journal_date, sequence, rank";
				$stmt = oci_parse($this->db,$qry);
				oci_bind_by_name($stmt,":id",$line['REQUEST_ID']);
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
