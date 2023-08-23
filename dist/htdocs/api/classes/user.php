<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class User extends HRForms2 {
	private $_arr = array();

	function __construct($req,$rjson=true) {
		$this->allowedMethods = "GET,POST,PUT,PATCH,DELETE"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
		$this->reqAuth = true; //default: true - NB: See note above
		$this->retJSON = $rjson;
		$this->req = $req;
		$this->init();
	}

	private function getSUNYHRUser() {
		$qry = "select ".$this->BASE_PERSEMP_FIELDS.", 
		r.recent_campus_date, g.user_groups, u.user_options
		from buhr.buhr_persemp_mv@banner.cc.binghamton.edu p
		left join (select suny_id as recent_suny_id, recent_campus_date from buhr.buhr_general_info_mv@banner.cc.binghamton.edu) r on (r.recent_suny_id = p.suny_id)
		left join (select suny_id as groups_suny_id, listagg(group_id,',') within group (order by group_id) as user_groups from hrforms2_user_groups group by suny_id) g on (g.groups_suny_id = p.suny_id)
		left join (select suny_id as user_suny_id, user_options from hrforms2_users) u on (u.user_suny_id = p.suny_id)
		where p.role_status = 'C' and p.suny_id = :suny_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":suny_id", $this->req[0]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		$row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
		if (isset($row['SUNY_ID'])) $row['USER_OPTIONS'] = (is_object($row['USER_OPTIONS']))?$row['USER_OPTIONS']->load():null;
		oci_free_statement($stmt);
		return $row;
	}

	private function updateUserInfo($data) {
		$qry = "update HRFORMS2_USERS set 
		refresh_date = sysdate, user_info = EMPTY_CLOB() 
		where suny_id = :suny_id
		returning user_info into :user_info";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":suny_id", $this->req[0]);
		$clob = oci_new_descriptor($this->db, OCI_D_LOB);
		oci_bind_by_name($stmt,":user_info", $clob, -1, OCI_B_CLOB);
		$r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
		if (!$r) $this->raiseError();
		$clob->save(json_encode($data));
		oci_commit($this->db);
		oci_free_statement($stmt);
		return $r;
	}

	/**
	 * validate called from init()
	 */
	function validate() {
		if (!isset($this->req[0]) && !$this->sessionData['isAdmin']) $this->raiseError(400);
		// req[0] == session user SUNY ID unless admin; only admin can get other SUNYID
		if ($this->method != "GET" && !$this->sessionData['isAdmin']) $this->raiseError(403);
		if ($this->method == 'PUT' && !isset($this->req[0])) $this->raiseError(400);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
		if (!isset($this->req[0])) {
			$qry = "select p.*, u.suny_id as user_suny_id, u.created_date, u.created_by, u.start_date, u.end_date,
				d.group_id, g.group_name, u.user_options.notifications
			from hrforms2_users u
			left join (select distinct ".$this->BASE_PERSEMP_FIELDS." from buhr.buhr_persemp_mv@banner.cc.binghamton.edu) p on (u.suny_id = p.suny_id)
			left join (select department_code, group_id from hrforms2_group_departments) d on (p.REPORTING_DEPARTMENT_CODE = d.DEPARTMENT_CODE)
			left join (select group_id, group_name from hrforms2_groups) g on (d.group_id = g.group_id)";
			$stmt = oci_parse($this->db,$qry);
			$r = oci_execute($stmt);
			if (!$r) $this->raiseError();
			while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
				//$this->userAttributes($row);
				// N.B. Cannot do this for all users; too slow
				//$row['USER_OPTIONS'] = (is_object($row['USER_OPTIONS']))?$row['USER_OPTIONS']->load():null;
				$this->_arr[] = $row;
			}
			oci_free_statement($stmt);
			$this->returnData = $this->_arr;
			if ($this->retJSON) $this->toJSON($this->returnData);
		} else {
			$qry = "select suny_id, to_char(end_date,'DD-MON-YYYY HH24:MI') as end_date,
				to_char(refresh_date,'DD-MON-YYYY') as refresh_date, user_info, user_options
				from HRFORMS2_USERS u where suny_id = :suny_id";
			$stmt = oci_parse($this->db,$qry);
			oci_bind_by_name($stmt,":suny_id", $this->req[0]);
			$r = oci_execute($stmt);
			if (!$r) $this->raiseError();
			$user = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
			if (isset($user['SUNY_ID'])) {
				$existing = true;
				$user['USER_INFO'] = (is_object($user['USER_INFO']))?$user['USER_INFO']->load():"";
				$user['USER_OPTIONS'] = (is_object($user['USER_OPTIONS']))?$user['USER_OPTIONS']->load():null;
			}
			oci_free_statement($stmt);

			// User does not exist
			if (!$existing) {
				$this->_arr = $this->getSUNYHRUser();
				if (!$this->_arr) $this->raiseError(E_BAD_REQUEST,array('errMsg'=>'SUNY ID Not Found'));
				// done; return JSON

			// User exists
			} else {
				$now = new DateTime();
				$end_date = DateTime::createFromFormat('d-M-Y H:i',$user['END_DATE']);
				$end_diff = -1;
				if ($end_date) {
					$diff = $end_date->diff($now);
					$end_diff = $diff->d*1440+$diff->h*60+$diff->i;
					$end_diff = ($diff->invert == 1)?$end_diff*-1:$end_diff;
				}
				// User is Inactive/Ended
				if ($end_diff > 0) {
					if ($user['USER_INFO']) { // user has user_info
						$this->_arr = json_decode($user['USER_INFO'], true);
						
					} else { // user does not have user_info
						if ($end_diff > 259200) { // user ended more than 6 months ago
								// User is Inactive, does not have user_info, and was ended more than 6 months ago.
								$message = "The SUNY ID <strong>" . $this->req[0] . "</strong> does not have cached information and was ended more than 6 months ago.  Will not update cached information";
								$this->sendError($message,'HRForms2 Error: Old User With No Data');
								$this->raiseError(E_NOT_FOUND);	
						} else {
							$this->_arr = $this->getSUNYHRUser();
							if (!$this->_arr) {
								// User is Inactive, does not have user_info, and does not have SUNY HR data; User DNE
								$message = "The SUNY ID <strong>" . $this->req[0] . "</strong> does not exist in SUNY HR, but exists in HRForms2.  Cannot update cached information.";
								$this->sendError($message,'HRForms2 Error: Missing SUNY ID in SUNY HR');
								$this->raiseError(E_NOT_FOUND);	
							} else {
								$this->updateUserInfo($this->_arr);
							}
						}
					}

				// User is Active
				} else {
					// check refresh date
					$settings = (new settings(array(),false))->returnData;
					$refresh_date = DateTime::createFromFormat('d-M-Y',$row['REFRESH_DATE']);
					$refresh_diff = -1;
					if ($refresh_date) {
						$diff = $refresh_date->diff($now);
						$refresh_diff = ($diff->invert == 1)?$diff->d*-1:$diff->d;
					}
					if ($refresh_diff > $settings['general']['userRefresh']) { // user_info is "stale"
						$this->_arr = $this->getSUNYHRUser();
						if (!$this->_arr) { // No SUNY HR data; use existing cached data
							// if refresh diff is greater than $userRefresh setting + 14 days; set end date on user and send error
							$refresh_timeout = $settings['general']['userRefresh']+14;
							if ($refresh_diff > $refresh_timeout) {
								$qry = "update HRFORMS2_USERS set END_DATE = systimestamp where suny_id = :suny_id";
								$stmt = oci_parse($this->db,$qry);
								oci_bind_by_name($stmt,":suny_id", $this->req[0]);
								$r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
								if (!$r) $this->raiseError();
								oci_commit($this->db);
								oci_free_statement($stmt);
								$message = "The SUNY ID <strong>" . $this->req[0] . "</strong> is active, but has not been able to be refreshed in ". $refresh_timeout . " days.  The user has been deactivated.";
								$this->sendError($message,'HRForms2 Error: User Deactivated');
							}
							$this->_arr = json_decode($user['USER_INFO'], true);
						} else { // update cached data and refresh date
							$this->updateUserInfo($this->_arr);
						}

					} else { // user_info is "fresh"
						$this->_arr = json_decode($user['USER_INFO'], true);
					}
				}
			}

			$this->returnData = array((array)$this->_arr); // Need to cast as array instead of object
			if ($this->retJSON) $this->toJSON($this->returnData);
		}
	}

	function PUT() {
		$qry = "update hrforms2_users 
			set start_date = :start_date, 
			end_date = :end_date,
			user_options = EMPTY_CLOB()
			where suny_id = :suny_id
			returning user_options into :user_options";
		$stmt = oci_parse($this->db,$qry);
		$clob = oci_new_descriptor($this->db, OCI_D_LOB);
		oci_bind_by_name($stmt,":start_date", $this->POSTvars['START_DATE']);
		oci_bind_by_name($stmt,":end_date", $this->POSTvars['END_DATE']);
		oci_bind_by_name($stmt,":suny_id", $this->req[0]);
		oci_bind_by_name($stmt,":user_options", $clob, -1, OCI_B_CLOB);
		$r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
		if (!$r) $this->raiseError();
		$clob->save(json_encode($this->POSTvars['OPTIONS']));
		oci_commit($this->db);
		oci_free_statement($stmt);
		new usergroups(array($this->POSTvars['SUNY_ID']));
		$this->done();
	}

	function POST() {
		$options = json_encode($this->POSTvars['OPTIONS']);
		$qry = "insert into hrforms2_users values(:suny_id, sysdate, :created_by, :start_date, :end_date, null, EMPTY_CLOB(), :options) returning user_info into :user_info";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":suny_id", $this->POSTvars['SUNY_ID']);
		oci_bind_by_name($stmt,":created_by", $this->sessionData['EFFECTIVE_SUNY_ID']);
		oci_bind_by_name($stmt,":start_date", $this->POSTvars['START_DATE']);
		oci_bind_by_name($stmt,":end_date", $this->POSTvars['END_DATE']);
		oci_bind_by_name($stmt,":options", $options);
		$clob = oci_new_descriptor($this->db, OCI_D_LOB);
		oci_bind_by_name($stmt,":user_info", $clob, -1, OCI_B_CLOB);
		$r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
		if (!$r) $this->raiseError();
		$clob->save('');
		oci_commit($this->db);
		oci_free_statement($stmt);
		new usergroups(array($this->POSTvars['SUNY_ID']),false);
		// Fetch user to force the refresh action and return the user data in JSON response.
		$_SERVER['REQUEST_METHOD'] = 'GET';
		new user(array($this->POSTvars['SUNY_ID']));
	}

	function PATCH() {
		if (isset($this->POSTvars['END_DATE'])) {
			$qry = "update hrforms2_users set end_date = :end_date where suny_id = :suny_id";
			$stmt = oci_parse($this->db,$qry);
			oci_bind_by_name($stmt,":end_date", $this->POSTvars['END_DATE']);
			oci_bind_by_name($stmt,":suny_id", $this->req[0]);
			$r = oci_execute($stmt);
			if (!$r) $this->raiseError();
			oci_commit($this->db);
			oci_free_statement($stmt);
		}
		$this->done();
	}
	function DELETE() {
		$qry = "delete from hrforms2_users where suny_id = :suny_id";
		$stmt = oci_parse($this->db,$qry);
		oci_bind_by_name($stmt,":suny_id", $this->req[0]);
		$r = oci_execute($stmt);
		if (!$r) $this->raiseError();
		oci_commit($this->db);
		oci_free_statement($stmt);
		$this->done();
	}
}
