<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Requests extends HRForms2 {
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
		if ($this->method == 'DELETE') {
            if ($this->req[1] != $this->sessionData['SUNY_ID'] && $this->req[1] != $this->sessionData['OVR_SUNY_ID']) $this->raiseError(E_FORBIDDEN);
        }
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
        #$this->raiseError(401);
        if ($this->req[0] == 'draft') {
            $qry = "select DATA from HRFORMS2_REQUESTS_DRAFTS where SUNY_ID = :suny_id and UNIX_TS = :unix_ts";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":suny_id",$this->req[1]);
            oci_bind_by_name($stmt,":unix_ts",$this->req[2]);
            $r = oci_execute($stmt);
			if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
            $this->_arr['DATA'] = (is_object($row['DATA'])) ? $row['DATA']->load() : "";
            oci_free_statement($stmt);
			$this->returnData = json_decode($this->_arr['DATA']);
	        if ($this->retJSON) $this->toJSON($this->returnData);
        } else {
		    $this->done();
        }
	}

    function POST() {
        if ($this->POSTvars['action'] == 'submit') {
            // get user's group
            //include 'user.php';
            $_SERVER['REQUEST_METHOD'] = 'GET';
            $user = (new user(array($this->sessionData['SUNY_ID']),false))->returnData[0];
            $group = $this->getGroupIds($user['REPORTING_DEPARTMENT_CODE']);

            //get hierarchy for group
            //include 'hierarchy.php';
            $h = (new hierarchy(array('request','group',$group['GROUP_ID']),false))->returnData;
            $idx = array_search($this->POSTvars['posType']['id'],array_column($h,'POSITION_TYPE'));
            // if idx == -1 not found
            $hierarchy = $h[$idx];
            $groups = $hierarchy['GROUPS'];
            // get next group to
            $groups_array = explode(",",$groups);
            $group_to = $groups_array[0];
            
            //extract comments from JSON?

            // insert into hrforms2_request (get request id);
            $qry = "insert into HRFORMS2_REQUESTS 
            values(HRFORMS2_REQUEST_ID_SEQ.nextval,EMPTY_CLOB(),sysdate,EMPTY_CLOB()) 
            returning REQUEST_ID, CREATED_BY, REQUEST_DATA into :request_id, :created_by, :request_data";
            $stmt = oci_parse($this->db,$qry);
            $created_by = oci_new_descriptor($this->db, OCI_D_LOB);
            $request_data = oci_new_descriptor($this->db, OCI_D_LOB);
            oci_bind_by_name($stmt,":request_id", $request_id,-1,SQLT_INT);
            oci_bind_by_name($stmt, ":created_by", $created_by, -1, OCI_B_CLOB);
            oci_bind_by_name($stmt, ":request_data", $request_data, -1, OCI_B_CLOB);
            $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
            if (!$r) $this->raiseError();
            $created_by->save(json_encode($user));
            $request_data->save(json_encode($this->POSTvars));
            oci_commit($this->db);

            $request_data = array(
                'hierarchy_id'=>$hierarchy['HIERARCHY_ID'],
                'workflow_id'=>$hierarchy['WORKFLOW_ID'],
                'seq'=>$idx,
                'groups'=>$groups,
                'group_from'=>$group['GROUP_ID'],
                'group_to'=>$group_to,
                'request_id'=>$request_id
            );
            $this->POSTvars['request_data'] = $request_data;

            // insert into hrforms2_requests_journal
            //include 'journal.php';
            $_SERVER['REQUEST_METHOD'] = 'POST';
            //possibly make the request data a parent class array?
            $journal = (new journal(array($request_id,'S',$request_data),false))->returnData;

            // delete from hrforms2_requests_drafts (call delete)
            $_SERVER['REQUEST_METHOD'] = 'DELETE';
            $del_draft = (new requests($this->req,false));

            $this->toJSON($request_data);
        } else {
            $qry = "select count(*) from HRFORMS2_REQUESTS_DRAFTS where SUNY_ID = :suny_id";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['SUNY_ID']);
            $r = oci_execute($stmt);
			if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_ARRAY+OCI_RETURN_NULLS);
            oci_free_statement($stmt);
            if ($row[0] > MAX_DRAFTS) {
                $this->raiseError(E_TOO_MANY_DRAFTS);
                return;
            }
            $unix_ts = time();
            $qry = "insert into HRFORMS2_REQUESTS_DRAFTS values(:suny_id, :unix_ts, EMPTY_CLOB()) returning DATA into :data";
            $stmt = oci_parse($this->db,$qry);
            $clob = oci_new_descriptor($this->db, OCI_D_LOB);
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['SUNY_ID']);
            oci_bind_by_name($stmt, ":unix_ts", $unix_ts);
            oci_bind_by_name($stmt, ":data", $clob, -1, OCI_B_CLOB);
            $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
            if (!$r) $this->raiseError();
            $clob->save(json_encode($this->POSTvars));
            oci_commit($this->db);
            $this->done();
        }
    }

    function PUT() {
        if ($this->req[0] == 'draft') {
            $qry = "update HRFORMS2_REQUESTS_DRAFTS set data = EMPTY_CLOB() 
                where SUNY_ID = :suny_id and unix_ts = :unix_ts
                returning DATA into :data";
            $stmt = oci_parse($this->db,$qry);
            $clob = oci_new_descriptor($this->db, OCI_D_LOB);
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['SUNY_ID']);
            oci_bind_by_name($stmt, ":unix_ts", $this->req[2]);
            oci_bind_by_name($stmt, ":data", $clob, -1, OCI_B_CLOB);
            $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
            if (!$r) $this->raiseError();
            $clob->save(json_encode($this->POSTvars));
            oci_commit($this->db);
            if ($this->retJSON) $this->done();
        } else {
            $this->toJSON($this->req);
        }
    }

    function DELETE() {
        if ($this->req[0] == 'draft') {
            $qry = "delete from HRFORMS2_REQUESTS_DRAFTS where SUNY_ID = :suny_id and UNIX_TS = :unix_ts";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['SUNY_ID']);
            oci_bind_by_name($stmt, ":unix_ts", $this->req[2]);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            oci_commit($this->db);
            if ($this->retJSON) $this->done();
        } else {
            //raise error; cannot delete non-drafts.
            $this->raiseError(E_METHOD_NOT_ALLOWED);
        }
    }
}
