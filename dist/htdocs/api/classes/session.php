<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Session extends HRForms2 {
	private $_arr = array();

	function __construct($req,$rjson=true) {
		$this->allowedMethods = "GET,PATCH,DELETE"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
		$this->reqAuth = false; //default: true - NB: See note above
		$this->retJSON = $rjson;
		$this->req = $req;
		$this->init();
	}

	function validate() {
        if ($this->method == 'PATCH') {
            if (!$this->checkAuth()) $this->raiseError(401);
            if (!$this->sessionData['isAdmin']) $this->raiseError(403);
            if (!isset($this->POSTvars['IMPERSONATE_SUNY_ID'])) $this->raiseError(400);
        }
    }
    
    /* helper functions */
    protected function getLastInfo() {
        $sid = $this->sessionData['SESSION_ID'];
        $empty = array("LAST_IP_ADDRESS"=>"","LAST_LOGIN_DATE"=>"");
        if (!$sid) return $empty;
        $qry = "select ip_address as LAST_IP_ADDRESS, login_date as LAST_LOGIN_DATE from (
            select ip_address,login_date,
            rank() over (partition by bnumber order by login_date desc) as my_rank
            from hrforms2_sessions
            where bnumber = :bnumber and session_id <> :sid)
        where my_rank = 1";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":bnumber",$this->sessionData['BNUMBER']);
        oci_bind_by_name($stmt,":sid",$sid);
        oci_execute($stmt);
        $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
        oci_free_statement($stmt);
        if (!$row) return $empty;
        return $row;
    }

    function GET() {
        $this->checkAuth();
        $lastInfo = $this->getLastInfo();
        $this->sessionData = array_merge($this->sessionData,$lastInfo);
        $this->toJSON($this->sessionData);
    }

    function PATCH() {
        // insert/update into session_override
        // TODO: need some GC cleanup
        $now = time();
        if ($this->POSTvars['IMPERSONATE_SUNY_ID'] != '') {
            $qry = "insert into hrforms2_session_override values(:session_id,:cas_session_id,:suny_id,:ovr_by,:start_ovr,null)";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":session_id",$this->sessionData['SESSION_ID']);
            oci_bind_by_name($stmt,":cas_session_id",$this->sessionData['CAS_SID']);
            oci_bind_by_name($stmt,":suny_id",$this->POSTvars['IMPERSONATE_SUNY_ID']);
            oci_bind_by_name($stmt,":ovr_by",$this->sessionData['SUNY_ID']);
            oci_bind_by_name($stmt,":start_ovr",$now);
        } else {
            $qry = "update hrforms2_session_override set end_override = :end_ovr where session_id = :session_id and cas_session_id = :cas_session_id and end_override is null";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":end_ovr",$now);
            oci_bind_by_name($stmt,":session_id",$this->sessionData['SESSION_ID']);
            oci_bind_by_name($stmt,":cas_session_id",$this->sessionData['CAS_SID']);
        }
        oci_execute($stmt);
        //return user
        $id = ($this->POSTvars['IMPERSONATE_SUNY_ID'] != '')?$this->POSTvars['IMPERSONATE_SUNY_ID']:$this->sessionData['SUNY_ID'];
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $user = new user(array($id),false);
        $this->toJSON($user->returnData);
    }

    function DELETE() {
        $this->done();
    }
}
