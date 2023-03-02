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
                    drafts.data.person.information.FIRST_NAME as FIRST_NAME,
                    drafts.data.person.information.LEGAL_MIDDLE_NAME as LEGAL_MIDDLE_NAME,
                    drafts.data.person.information.LEGAL_LAST_NAME as LEGAL_LAST_NAME,
                    drafts.data.formActions.formCode as FORM_CODE,
                    drafts.data.formActions.formCodeTitle as FORM_CODE_TITLE,
                    drafts.data.formActions.actionCode as ACTION_CODE,
                    drafts.data.formActions.actionCodeTitle as ACTION_CODE_TITLE,
                    drafts.data.formActions.transactionCode as TRANSACTION_CODE,
                    drafts.data.formActions.transactionCodeTitle as TRANSACTION_CODE_TITLE,
                    drafts.data.payroll.code as PAYROLL_CODE,
                    drafts.data.payroll.title as PAYROLL_TITLE,
                    drafts.data.payroll.description as PAYROLL_DESCRIPTION,
                    drafts.data.employment.position.positionDetails.LINE_NUMBER as LINE_NUMBER,
                    drafts.data.employment.position.positionDetails.TITLE as TITLE,
                    '0' as sequence, ' ' as groups, ' ' as journal_status
				from hrforms2_forms_drafts drafts 
                where suny_id = :suny_id";
				break;
			case "archived":
				//separate PHP?  archive.php?
				$this->done();
			default:
				$this->raiseError(E_BAD_REQUEST);
		}
		$stmt = oci_parse($this->db,$qry);
		//TODO: remove for testing:
		$id = (isset($this->req[1]))?$this->req[1]:$this->sessionData['EFFECTIVE_SUNY_ID'];
		oci_bind_by_name($stmt,":suny_id",$id);
		oci_execute($stmt);
		while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
			$this->_arr[] = $row;
		}
		oci_free_statement($stmt);
		$this->returnData = $this->_arr;
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
}
