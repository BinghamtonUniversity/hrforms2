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
				$qry = "select suny_id, unix_ts, drafts.data.reqId as REQUEST_ID, drafts.data.posType, drafts.data.reqType, drafts.data.effDate,
				drafts.data.candidateName, 'draft' as status, '0' as sequence, ' ' as groups, ' ' as journal_status
				from hrforms2_requests_drafts drafts where suny_id = :suny_id";
				break;

			case "approvals":
				$qry = "select r.request_id, r.created_by.SUNY_ID as created_by_suny_id, 
				to_char(r.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				r.request_data.posType, r.request_data.reqType, r.request_data.effDate, r.request_data.candidateName,
				r.created_by.LEGAL_FIRST_NAME, r.created_by.LEGAL_LAST_NAME, r.created_by.ALIAS_FIRST_NAME,
				j.status, j.sequence, w.groups,js.journal_status
				from hrforms2_requests r,
				(select jr2.* from (select jr1.*,
					rank() over (partition by jr1.request_id order by jr1.journal_date desc) as rnk
					from hrforms2_requests_journal jr1
				) jr2
				where jr2.rnk = 1 and jr2.status = 'PA' and
				jr2.group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)) j
				left join (select workflow_id, groups from hrforms2_requests_workflow) w on (j.workflow_id = w.workflow_id)
				left join (select request_id, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_requests_journal where sequence >= 0 group by request_id) js on (js.request_id = j.request_id)
				where r.request_id = j.request_id
				and r.created_by.SUNY_ID != :suny_id";
				break;
			case "rejections":
				$qry = "select r.request_id, r.created_by.SUNY_ID as created_by_suny_id, 
				to_char(r.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				r.request_data.posType, r.request_data.reqType, r.request_data.effDate, r.request_data.candidateName,
				r.created_by.LEGAL_FIRST_NAME, r.created_by.LEGAL_LAST_NAME, r.created_by.ALIAS_FIRST_NAME,
				j.status, j.sequence, w.groups,js.journal_status
				from hrforms2_requests r,
				(select jr2.* from (select jr1.*,
					rank() over (partition by jr1.request_id order by jr1.journal_date desc) as rnk
					from hrforms2_requests_journal jr1
				) jr2
				where jr2.rnk = 1 and jr2.status = 'R') j
				left join (select workflow_id, groups from hrforms2_requests_workflow) w on (j.workflow_id = w.workflow_id)
				left join (select request_id, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_requests_journal where sequence >= 0 group by request_id) js on (js.request_id = j.request_id)
				where r.request_id = j.request_id
				and r.created_by.SUNY_ID = :suny_id";
				break;
			case "pending":
				//TODO: exclude "final/completed/archived"; get LAST status and exclude
				$qry = "select r.request_id, r.created_by.SUNY_ID as created_by_suny_id,
				to_char(r.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				r.request_data.posType, r.request_data.reqType, r.request_data.effDate, r.request_data.candidateName,
				r.created_by.LEGAL_FIRST_NAME, r.created_by.LEGAL_LAST_NAME, r.created_by.ALIAS_FIRST_NAME,
				j.status, j.sequence, w.groups,js.journal_status
				from hrforms2_requests r,
				(select jr2.* from (select jr1.*,
					rank() over (partition by jr1.request_id order by jr1.sequence desc) as rnk
					from hrforms2_requests_journal jr1
					where jr1.request_id in (select request_id from hrforms2_requests_journal where suny_id = :suny_id and status = 'S')) jr2
				where jr2.rnk = 1 and jr2.status in ('PA','PF')) j
				left join (select workflow_id, groups from hrforms2_requests_workflow) w on (j.workflow_id = w.workflow_id)
				left join (select request_id, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_requests_journal where sequence >= 0 group by request_id) js on (js.request_id = j.request_id)
				where r.request_id = j.request_id";
				break;
			case "final":
				$qry = "select r.request_id, r.created_by.SUNY_ID as created_by_suny_id, 
				to_char(r.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				r.request_data.posType, r.request_data.reqType, r.request_data.effDate, r.request_data.candidateName,
				r.created_by.LEGAL_FIRST_NAME, r.created_by.LEGAL_LAST_NAME, r.created_by.ALIAS_FIRST_NAME,
				j.status, j.sequence, w.groups,js.journal_status
				from hrforms2_requests r,
				(select jr2.* from (select jr1.*,
					rank() over (partition by jr1.request_id order by jr1.journal_date desc) as rnk
					from hrforms2_requests_journal jr1
				) jr2
				where jr2.rnk = 1 and jr2.status ='PF' and
				jr2.group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id)) j
				left join (select workflow_id, groups from hrforms2_requests_workflow) w on (j.workflow_id = w.workflow_id)
				left join (select request_id, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_requests_journal where sequence >= 0 group by request_id) js on (js.request_id = j.request_id)
				where r.request_id = j.request_id
				and r.created_by.SUNY_ID != :suny_id";
				break;
			case "archived":
				$qry = "select r.request_id, r.created_by.SUNY_ID as created_by_suny_id,
				 to_char(r.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				r.request_data.posType, r.request_data.reqType, r.request_data.effDate, r.request_data.candidateName,
				r.created_by.LEGAL_FIRST_NAME, r.created_by.LEGAL_LAST_NAME, r.created_by.ALIAS_FIRST_NAME,
				j.status, j.sequence, w.groups,js.journal_status
				from hrforms2_requests_archive r,
				(select jr2.* from (select jr1.*,
					rank() over (partition by jr1.request_id order by jr1.journal_date desc) as rnk
					from hrforms2_requests_journal_archive jr1
				) jr2
				where jr2.rnk = 1 and jr2.status ='Z') j
				left join (select workflow_id, groups from hrforms2_requests_workflow) w on (j.workflow_id = w.workflow_id)
				left join (select request_id, listagg(status,',') within group (order by sequence) as journal_status from hrforms2_requests_journal_archive where sequence >= 0 group by request_id) js on (js.request_id = j.request_id)
				where r.request_id = j.request_id
				and r.created_by.SUNY_ID = :suny_id";
				break;
			default:
				$this->raiseError(E_BAD_REQUEST);
		}
		$stmt = oci_parse($this->db,$qry);
		//TODO: remove for testing:
		$id = (isset($this->req[1]))?$this->req[1]:$this->sessionData['EFFECTIVE_SUNY_ID'];
		oci_bind_by_name($stmt,":suny_id",$id);
		oci_execute($stmt);
		while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
			$row['POSTYPE'] = json_decode($row['POSTYPE']);
			$row['REQTYPE'] = json_decode($row['REQTYPE']);
			$this->_arr[] = $row;
		}
		oci_free_statement($stmt);
		$this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
}
