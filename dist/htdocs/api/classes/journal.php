<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Journal extends HRForms2 {
	private $_arr = array();

	function __construct($req,$rjson=true) {
		$this->allowedMethods = "GET,POST"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
		$this->reqAuth = true; //default: true - NB: See note above
		$this->retJSON = $rjson;
		$this->req = $req;
		$this->init();
	}

	/**
	 * validate called from init()
	 */
	function validate() {
		// Validation...
        if ($this->method == 'GET' && !isset($this->req[0])) $this->raiseError(E_BAD_REQUEST);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
        switch($this->req[0]) {
            case "request":
                $qry = "select request_id, to_char(journal_date,'DD-MON-YYYY HH24:MI:SS') as journal_date,
                j.suny_id, legal_last_name,legal_first_name,legal_middle_name,alias_first_name,
                status, hierarchy_id, workflow_id, sequence, group_from, gf.group_name as GROUP_FROM_NAME, 
                group_to, gt.group_name as GROUP_TO_NAME, comments
                from hrforms2_requests_journal j
                left join (select distinct suny_id, legal_last_name,legal_first_name,legal_middle_name,alias_first_name
                from buhr.buhr_persemp_mv@banner.cc.binghamton.edu) p on (j.suny_id = p.suny_id) 
                left join (select group_id, group_name from hrforms2_groups) gf on (j.group_from = gf.group_id)
                left join (select group_id, group_name from hrforms2_groups) gt on (j.group_to = gt.group_id)
                where request_id = :request_id
                order by sequence";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":request_id",$this->req[1]);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
                    $comments = (is_object($row['COMMENTS']))?$row['COMMENTS']->load():"";
                    unset($row['COMMENTS']);
                    $row['COMMENTS'] = $comments;
                    $this->_arr[] = $row;
                }
                oci_free_statement($stmt);
                $this->returnData = $this->_arr;
                if ($this->retJSON) $this->toJSON($this->returnData);
                break;
            case "form":
                $qry = "select form_id, to_char(journal_date,'DD-MON-YYYY HH24:MI:SS') as journal_date,
                j.suny_id, legal_last_name,legal_first_name,legal_middle_name,alias_first_name,
                status, hierarchy_id, workflow_id, sequence, group_from, gf.group_name as GROUP_FROM_NAME, 
                group_to, gt.group_name as GROUP_TO_NAME, comments
                from hrforms2_forms_journal j
                left join (select distinct suny_id, legal_last_name,legal_first_name,legal_middle_name,alias_first_name
                from buhr.buhr_persemp_mv@banner.cc.binghamton.edu) p on (j.suny_id = p.suny_id) 
                left join (select group_id, group_name from hrforms2_groups) gf on (j.group_from = gf.group_id)
                left join (select group_id, group_name from hrforms2_groups) gt on (j.group_to = gt.group_id)
                where form_id = :form_id
                order by sequence";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":form_id",$this->req[1]);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
                    $comments = (is_object($row['COMMENTS']))?$row['COMMENTS']->load():"";
                    unset($row['COMMENTS']);
                    $row['COMMENTS'] = $comments;
                    $this->_arr[] = $row;
                }
                oci_free_statement($stmt);
                $this->returnData = $this->_arr;
                if ($this->retJSON) $this->toJSON($this->returnData);
                break;
        }
	}
    function POST() {
        switch($this->req[0]) {
            case "request":
                $qry = "insert into HRFORMS2_REQUESTS_JOURNAL 
                values(:request_id, sysdate, :suny_id, :status, :hierarchy_id, :workflow_id, :seq, :group_from, :group_to, EMPTY_CLOB())
                returning COMMENTS into :comments";
                $stmt = oci_parse($this->db,$qry);
                $comments = oci_new_descriptor($this->db, OCI_D_LOB);
                oci_bind_by_name($stmt,":request_id", $this->req[1]);
                oci_bind_by_name($stmt,":status", $this->req[2]);
                oci_bind_by_name($stmt,":suny_id", $this->sessionData['EFFECTIVE_SUNY_ID']);
                oci_bind_by_name($stmt,":hierarchy_id", $this->req[3]['hierarchy_id']);
                oci_bind_by_name($stmt,":workflow_id", $this->req[3]['workflow_id']);
                oci_bind_by_name($stmt,":seq", $this->req[3]['seq']);
                oci_bind_by_name($stmt,":group_from", $this->req[3]['group_from']);
                oci_bind_by_name($stmt,":group_to", $this->req[3]['group_to']);
                oci_bind_by_name($stmt,":comments", $comments, -1, OCI_B_CLOB);
                $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
                if (!$r) $this->raiseError();
                $comments->save($this->req[3]['comment']);
                oci_commit($this->db);
                if ($this->retJSON) $this->done();        
                break;
            case "form":
                $qry = "insert into HRFORMS2_FORMS_JOURNAL 
                values(:form_id, sysdate, :suny_id, :status, :hierarchy_id, :workflow_id, :seq, :group_from, :group_to, EMPTY_CLOB())
                returning COMMENTS into :comments";
                $stmt = oci_parse($this->db,$qry);
                $comments = oci_new_descriptor($this->db, OCI_D_LOB);
                oci_bind_by_name($stmt,":form_id", $this->req[1]);
                oci_bind_by_name($stmt,":status", $this->req[2]);
                oci_bind_by_name($stmt,":suny_id", $this->sessionData['EFFECTIVE_SUNY_ID']);
                oci_bind_by_name($stmt,":hierarchy_id", $this->req[3]['hierarchy_id']);
                oci_bind_by_name($stmt,":workflow_id", $this->req[3]['workflow_id']);
                oci_bind_by_name($stmt,":seq", $this->req[3]['seq']);
                oci_bind_by_name($stmt,":group_from", $this->req[3]['group_from']);
                oci_bind_by_name($stmt,":group_to", $this->req[3]['group_to']);
                oci_bind_by_name($stmt,":comments", $comments, -1, OCI_B_CLOB);
                $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
                if (!$r) $this->raiseError();
                $comments->save($this->req[3]['comment']);
                oci_commit($this->db);
                if ($this->retJSON) $this->done();        
                break;
        }
    }
}
