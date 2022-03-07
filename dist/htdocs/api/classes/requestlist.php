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
				drafts.data.candidateName
				from hrforms2_requests_drafts drafts where suny_id = :suny_id";
				break;
			case "approvals":
				$qry = "select r.request_id, r.created_by.SUNY_ID, to_char(r.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				r.request_data.posType, r.request_data.reqType, r.request_data.effDate, r.request_data.candidateName,
				r.created_by.LEGAL_FIRST_NAME, r.created_by.LEGAL_LAST_NAME, r.created_by.ALIAS_FIRST_NAME
				from hrforms2_requests r
				where r.request_id in (select j.request_id
					from (select jr.*,
						rank() over (partition by jr.request_id order by jr.journal_date desc) as rnk
						from hrforms2_requests_journal jr) j
					where j.rnk = 1
					and group_to in (select group_id from hrforms2_user_groups where suny_id = :suny_id))";
				break;
			case "rejections":
				$qry = "select r.request_id, r.created_by.SUNY_ID, to_char(r.created_date,'DD-MON-YYYY HH24:MI:SS') as created_date, 
				r.request_data.posType, r.request_data.reqType, r.request_data.effDate, r.request_data.candidateName,
				r.created_by.LEGAL_FIRST_NAME, r.created_by.LEGAL_LAST_NAME, r.created_by.ALIAS_FIRST_NAME
				from hrforms2_requests r
				where r.request_id in (select j.request_id
				  from (select jr.*,
					rank() over (partition by jr.request_id order by jr.journal_date desc) as rnk
					from hrforms2_requests_journal jr) j
				  where j.rnk = 1
				  and j.status = 'R'
				)
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
