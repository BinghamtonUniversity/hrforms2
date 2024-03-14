<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class News extends HRForms2 {
	private $_arr = array();

	function __construct($req,$rjson=true) {
		$this->allowedMethods = "GET,PATCH"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
		$this->reqAuth = true; //default: true - NB: See note above
		$this->retJSON = $rjson;
		$this->req = $req;
		$this->init();
	}

	/**
	 * validate called from init()
	 */
	function validate() {
		if ($this->method != 'GET' && !$this->sessionData['isAdmin']) $this->raiseError(403);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
        $qry = "select NEWS_TEXT, to_char(modified_date,'DD-MON-YY HH24:MI:SS') as MODIFIED_DATE, MODIFIED_BY from hrforms2_news";
        $stmt = oci_parse($this->db,$qry);
        oci_execute($stmt);
        $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS+OCI_RETURN_LOBS);
		$row['NEWS_TEXT'] = $row['NEWS_TEXT'];
		oci_free_statement($stmt);
		$this->returnData = $this->null2Empty($row);
		if ($this->retJSON) $this->toJSON($this->returnData);
	}
	function PATCH() {
		$qry = "update hrforms2_news set news_text = EMPTY_CLOB(), modified_date = sysdate returning news_text into :news";
		$stmt = oci_parse($this->db,$qry);
		$clob = oci_new_descriptor($this->db, OCI_D_LOB);
		oci_bind_by_name($stmt, ":news", $clob, -1, OCI_B_CLOB);
		oci_execute($stmt,OCI_NO_AUTO_COMMIT);
		$clob->save($this->POSTvars['NEWS_TEXT']);
		oci_commit($this->db);
		oci_free_statement($stmt);
		$this->GET();
		exit();
	}
    function PUT() {
		$this->done();
		/*$qry = "update hrforms2_news set news_title = :title, news_start_date = :start_date, news_end_date = :end_date, 
			news_text = '{}', modified_date = sysdate
			where news_id = :id returning news_text into :json";
		$stmt = oci_parse($this->db,$qry);
		$clob = oci_new_descriptor($this->db, OCI_D_LOB);
		oci_bind_by_name($stmt, ":title", $this->POSTvars['newsTitle']);
		oci_bind_by_name($stmt, ":start_date", $this->POSTvars['newsStartDate']);
		oci_bind_by_name($stmt, ":end_date", $this->POSTvars['newsEndDate']);
		oci_bind_by_name($stmt, ":id", $this->req[0]);
		oci_bind_by_name($stmt, ":json", $clob, -1, OCI_B_CLOB);
		oci_execute($stmt,OCI_DEFAULT);
		$clob->save($this->POSTvars['newsText']);
		oci_commit($this->db);
		oci_free_statement($stmt);
        $this->done();*/
    }
}
