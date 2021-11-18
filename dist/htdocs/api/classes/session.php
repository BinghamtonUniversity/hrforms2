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
		$this->allowedMethods = "GET,POST,PATCH,DELETE"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
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

    protected function check_existing_session() {
        if(isset($_COOKIE['session'])) {
            //echo "Cookie: Session exists: " . $_COOKIE['session'] ."\n";
            $qry = "select user_id from hrforms2_sessions
                where cas_session_id = :cas_sid and session_id = :sid
                and user_id = :userid and ip_address = :ip_addr";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt, ":cas_sid", $this->sessionData['CAS_SID']);
            oci_bind_by_name($stmt, ":sid", $_COOKIE['session']);
            oci_bind_by_name($stmt, ":userid", $this->sessionData['USER_ID']);
            oci_bind_by_name($stmt, ":ip_addr", $this->sessionData['IP_ADDRESS']);
            oci_execute($stmt);
            $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
            if (!isset($row['USER_ID'])) {
                //echo "Session: no matching session for: \n";
                $this->POST();
            }
        } else {
            //echo "Cookie: Session NOT set, creating new session\n";
            $this->POST();
        }
        return;
    }

    function GET() {
        require $_SERVER['DOCUMENT_ROOT'] . '/../etc/CASconfig.php';
        require $phpcas_path . '/CAS.php';
        if (!CAS_HOST && INSTANCE == 'LOCAL') {
            $json = json_decode($_COOKIE['hrforms2_local']);
            $this->sessionData = array_merge($this->sessionData,array('CAS_SID'=>'local','USER_ID'=>$json->userid,'BNUMBER'=>$json->bnumber,'IP_ADDRESS'=>$_SERVER['REMOTE_ADDR']));
            $this->check_existing_session();
        } else {
            // CAS Auth
            session_set_cookie_params($client_lifetime,$client_path,$client_domain,$client_secure,$client_httpOnly);
            //phpCAS::setDebug();
            //phpCAS::setVerbose(true);
            phpCAS::client(CAS_VERSION_3_0, $cas_host, $cas_port, $cas_context);
            phpCAS::setCasServerCACert($cas_server_ca_cert_path);
            phpCAS::setNoCasServerValidation();//TODO: should this be off?
            phpCAS::handleLogoutRequests(true, $cas_real_hosts);
            phpCAS::forceAuthentication();
            if (phpCAS::isSessionAuthenticated()) {
                $this->sessionData = array_merge($this->sessionData,array('CAS_SID' => session_id(), 'USER_ID' => phpCAS::getUser(), 'BNUMBER' => phpCAS::getAttribute('UDC_IDENTIFIER'), 'IP_ADDRESS' => $_SERVER['REMOTE_ADDR']));
                //echo "CAS: Logged In:\n";
                //print_r($sessionData);
                $this->check_existing_session();
            } else {
                //die("Error: CAS not authenticated\n");
                $this->raiseError(401);
                //should not get here - if so there was an error.
            }
        }
        $this->sessionData['SESSION_ID'] = $_COOKIE['session'];
        $lastInfo = $this->getLastInfo();
        $sessInfo = $this->sessionInfo();
        $this->sessionData = array_merge($this->sessionData,$lastInfo,$sessInfo);
        $this->toJSON($this->sessionData);
    }

    function POST() {
        $qry = "select suny_id from sunyhr.hr_id@banner.cc.binghamton.edu
        where regexp_substr(campus_local_id,'(B[0-9]{8})',1,1,'i',1) = :id";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt, ":id", $this->sessionData['BNUMBER']);
        oci_execute($stmt);
        $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
        if (!isset($row['SUNY_ID'])) {
            //echo ('Error: could not map CAS login information to SUNY ID.');
            $this->raiseError(401);
        }
        $this->sessionData['SUNY_ID'] = $row['SUNY_ID'];
        $now = time();
            $qry = "insert into hrforms2_sessions values(SYS_GUID(),:cas_session_id,:user_id,:bnumber,:suny_id,:remote_ip,:login_date,:user_agent) returning session_id into :sid";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":cas_session_id",$this->sessionData['CAS_SID']);
            oci_bind_by_name($stmt,":user_id",$this->sessionData['USER_ID']);
            oci_bind_by_name($stmt,":bnumber",$this->sessionData['BNUMBER']);
            oci_bind_by_name($stmt,":suny_id",$this->sessionData['SUNY_ID']);
            oci_bind_by_name($stmt,":remote_ip",$this->sessionData['IP_ADDRESS']);
            oci_bind_by_name($stmt,":login_date",$now);
            oci_bind_by_name($stmt,":user_agent",$_SERVER['HTTP_USER_AGENT']);
            oci_bind_by_name($stmt,":sid",$sid,32);
            oci_execute($stmt);
        $this->sessionData['SESSION_ID'] = $sid;
        //echo "Session: New session created and cookie set: $sid\n";
        setcookie('session',$this->sessionData['SESSION_ID'],$client_lifetime,$client_path,$client_domain,$client_secure,$client_httpOnly);
        $_COOKIE['session'] = $this->sessionData['SESSION_ID'];
        if ($this->method == 'GET') {
            return;
        } else {
            $this->done();
        }
    }

    function PATCH() {
        // insert/update into session_override

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
