<?php
require $_SERVER['DOCUMENT_ROOT'] .'/../etc/config.php';

/* define error codes */
define("E_NO_DATA",204);
define("E_BAD_REQUEST",400);
define("E_NOT_AUTHORIZED",401);
define("E_NO_SESSION",481);
define("E_FORBIDDEN",403);
define("E_METHOD_NOT_ALLOWED",405);
define("E_NOT_FOUND",404);
define("E_TOO_MANY_DRAFTS",4291);
define("E_TEST",999);

Class HRForms2 {
	protected $db;
	protected $method;
	protected $POSTvars;
	protected $reqAuth = true;
	protected $allowedMethods = "";	protected $hasError = false;

	protected $sessionData = array('VERSION'=>VERSION,'REVISION'=>REVISION,'INSTANCE'=>INSTANCE,'HOST'=>HOST,'DEBUG'=>DEBUG);
	protected $userData = array();
	public $returnData;

	protected $BASE_PERSEMP_FIELDS = "suny_id,regexp_substr(b_number,'(B[0-9]{8})',1,1,'i',1) as b_number,legal_last_name,legal_first_name,legal_middle_name,alias_first_name,
	email_address_work,title_description,campus_title,derived_fac_type,card_affil,negotiating_unit,salary_grade,
	appointment_type,appointment_effective_date,appointment_end_date,appointment_percent,continuing_permanency_date,
	reporting_department_code,reporting_department_name,
	supervisor_suny_id,supervisor_last_name,supervisor_first_name";	

	function init(array $args = array()) {
		$this->AppPath = $_SERVER['DOCUMENT_ROOT'];
		// Set Allow response header indicating what methods are allowed.
		header('Allow:'.$this->allowedMethods);
		$this->method = $_SERVER['REQUEST_METHOD'];
		$this->POSTvars = file_get_contents("php://input");
		$this->POSTvars = json_decode($this->POSTvars,true);
		if (!$this->db) $this->connect();
		if ($this->reqAuth) $this->checkAuth();
		//TODO: if no db, change name ($this->method) to call a different "static" data function
		if (!method_exists($this,$this->method)) self::notAllowed();
		$this->validate();
		$refl = new ReflectionMethod($this,$this->method);
		return $refl->invokeArgs($this,array($args));
	}

	static function exceptionHandler($e) {
		header($_SERVER["SERVER_PROTOCOL"].' 500 Internal Server Error');
		header('Content-Type: application/json');
		echo json_encode(array("error"=>$e->getMessage(),"file"=>$e->getFile(),"line"=>$e->getLine()));
		exit();
	}
	function errorHandler($errno,$errstr,$errfile,$errline) {
		if (!error_reporting() & $errno) return false;
		switch($errno) {
			case E_USER_ERROR:
				//do something?
			default:
				$this->raiseError(500,array("errMsg"=>"$errstr in $errfile:$errline"));
		}
		exit();
  }

  final public function raiseError($errType = null,$errObj = array()) {
	switch($errType) {
		case E_NO_DATA: 
			$errStatus = 204;
			$errTitle = "No Content";
			$errMsg = "The requested resource returned no content.";
			break;
		case E_BAD_REQUEST:
			$errStatus = 400;
			$errTitle = "Bad Request";
			$errMsg = "Invalid or missing parameters in request.";
			break;
		case E_NOT_AUTHORIZED:
			$errStatus = 401;
			$errTitle = "Not Authorized";
			$errMsg = "Not authorized for requested resource.";
			break;
		case E_FORBIDDEN:
			$errStatus = 403;
			$errTitle = "Not Allowed";
			$errMsg = "The requested resource is not currently allowed.";
			break;
		case E_NOT_FOUND:
			$errStatus = 404;
			$errTitle = "Not Found";
			$errMsg = "No resource matching the request found.";
			break;
		case E_METHOD_NOT_ALLOWED:
			$errStatus = 405;
			$errTitle = "Method Not Allowed";
			$errMsg = "Method (".$this->method.") not allowed.";
			break;
		case E_TOO_MANY_DRAFTS:
			$errStatus = 429;
			$errTitle = "Too Many Requests";
			$errMsg = "User has too many open drafts.";
			break;	
		case E_NO_SESSION:
			$errStatus = 481;
			$errTitle = "No Session";
			$errMsg = "Session has not been initialized properly.";
			break;	
		default:
			$errStatus = 500;
			$errTitle = "Internal Server Error";
			$errMsg = error_get_last()['message'];
		}
		$errMsg = (isset($errObj['errMsg'])) ? $errObj['errMsg'] : $errMsg;
		$errCode = (isset($errObj['errCode'])) ? $errStatus . "::" . $errObj['errCode'] : $errStatus;
		header($_SERVER["SERVER_PROTOCOL"]." $errStatus $errTitle");
		header("X-Error-Description: " . $errMsg);
		//header("X-Response-Code: $errStatus");
		//header("X-Error-Message: " . (is_array($errMsg)) ? implode(',',$errMsg) : $errMsg);
		$this->toJSON(array("status"=>$errStatus,"title"=>$errTitle,"error"=>$errMsg,"errcode"=>$errCode));
		die();
    }

    protected function connect() {
		$this->db = @oci_connect(DBUSER,DBPASS,DB,NLS_LANG);
		$dbConn = (!$this->db) ? 'False' : 'True';
		header('X-DB-Connection:'.$dbConn);
		if (!$this->db) $this->raiseError();
		//make sure database link works:
	}

	protected function checkAuth() {
		if (!CAS_HOST && INSTANCE == 'LOCAL') {
			$this->sessionData = array_merge($this->sessionData,array("SESSION_ID"=>$_COOKIE['session'],"CAS_SID"=>"local"));
		} else {
			//do CAS check...
			phpCAS::client(CAS_VERSION_3_0, $cas_host, $cas_port, $cas_context);
			if (!phpCAS::isSessionAuthenticated()) $this->raiseError(401);
			$this->sessionData = array_merge($this->sessionData,array("SESSION_ID"=>$_COOKIE['session'],"CAS_SID"=>session_id()));
		}
		$sessInfo = $this->sessionInfo();
		if (!isset($sessInfo['SUNY_ID'])) $this->raiseError(401);
		return true;
	}

	protected function sessionInfo() {
		if (isset($this->sessionData['SUNY_ID'])) return $this->sessionData;
        $qry = "select s.suny_id, s.user_id, s.bnumber, s.ip_address, sp.spriden_pidm, em.email,
            ovr.suny_id as ovr_suny_id
            from hrforms2_sessions s
            left join (select session_id, cas_session_id, suny_id, override_by
                from hrforms2_session_override where end_override is null) ovr on (ovr.session_id = s.session_id and ovr.cas_session_id = s.cas_session_id)
            left join (select spriden_pidm, spriden_id from spriden@banner.cc.binghamton.edu where spriden_change_ind is null) sp on (sp.spriden_id = s.bnumber)
            left join (select goremal_pidm, goremal_email_address as email from goremal@banner.cc.binghamton.edu where goremal_emal_code = 'EMPL' and goremal_status_ind = 'A') em on (em.goremal_pidm = sp.spriden_pidm)
            where s.session_id = :sid and s.cas_session_id = :cas_sid";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt, ":cas_sid", $this->sessionData['CAS_SID']);
        oci_bind_by_name($stmt, ":sid", $this->sessionData['SESSION_ID']);
        oci_execute($stmt);
        $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
		$this->sessionData = (!$row)?array():array_merge($this->sessionData,$row);
		$this->isAdmin($this->sessionData['SUNY_ID']);
		return $this->sessionData;
	}

  	protected function notAllowed() {
		$this->raiseError(E_METHOD_NOT_ALLOWED);
	}

	protected function toJSON($out) {
		header('X-App-Version:'.VERSION);
		header('X-App-Revision:'.REVISION);
		header('Content-Type: application/json');
		//cache control:
		//header('Cache-Control:private,max-age=3600,must-revalidate'); //HTTP 1.1
		//header('Pragma:private'); //HTTP 1.0
		//header('Expires:0'); //Proxies
		echo json_encode($out);
	}

	protected function done() {
		$this->toJSON(array("success" => true));
	}

	/* CUSTOM APPLICATION FUNCTIONS */	
	/**
	* Returns true/false if the SUNY ID is in the local admin table
	* @param {number} $id - SUNY ID to check
	* @return {boolean} 
	*/
	protected function isAdmin($id) {
		if (isset($this->sessionData['isAdmin'])) return $this->sessionData['isAdmin'];
		$qry = "select count(suny_id) as IS_ADMIN from hrforms2_user_groups where group_id = -1 and suny_id = :sunyid";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt, ":sunyid", $id);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		$row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
		$this->sessionData['isAdmin'] = ($row['IS_ADMIN'] == '1') ? true : false;
		return $this->sessionData['isAdmin'];
	}

	/**
	 * Returns something...
	 * @param {number} $deptcode - Department Code to lookup 
	 * @return {Array}
	 */
	protected function getGroupIds($deptcode) {
		if (!isset($deptcode)) $this->raiseError(400); //return?
		$qry = "select group_id from hrforms2_group_departments where department_code = :dept_code";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt, ":dept_code", $deptcode);
		oci_execute($stmt);
		$group_id = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
		oci_free_statement($stmt);
		return $group_id;
	}
}