<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

/* Note:
    We are not using the OCI_RETURN_LOBS parameter for fetching as we have in other
    classes because the LOB data is used conditionally.  Rather than always returning
    it we only load it when needed.
*/

class User extends HRForms2 {
    private $_arr = array();

    protected $BASE_PERSEMP_FIELDS = "suny_id as SUNYHR_SUNY_ID,regexp_substr(b_number,'(B[0-9]{8})',1,1,'i',1) as b_number,legal_last_name,legal_first_name,legal_middle_name,alias_first_name,
    email_address_work,title_description,campus_title,derived_fac_type,card_affil,negotiating_unit,salary_grade,
    appointment_type,appointment_effective_date,appointment_end_date,appointment_percent,continuing_permanency_date,
    reporting_department_code,reporting_department_name,
    supervisor_suny_id,supervisor_last_name,supervisor_first_name";	

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
        if (isset($row['SUNYHR_SUNY_ID'])) $row['USER_OPTIONS'] = json_decode((is_object($row['USER_OPTIONS']))?$row['USER_OPTIONS']->load():"",true);
        oci_free_statement($stmt);
        return $row;
    }

    private function updateUserInfo($data) {
        // Remove USER_OPTIONS and REFRESH_DATE from $data
        unset($data['USER_OPTIONS']);
        unset($data['REFRESH_DATE']);
        // Add SUNY_ID if not set
        if (!isset($data['SUNY_ID'])) $data['SUNY_ID'] = $data['SUNYHR_SUNY_ID'];
        // must use: user_info = '{}' instead of user_info = EMPTY_CLOB(); causes TWO TASK error on server.
        // local does not work with user_info = '{}'; wants user_info = EMPTY_CLOB()
        if (INSTANCE == "LOCAL") {
            $update_qry = "update HRFORMS2_USERS 
                set refresh_date = sysdate, user_info = EMPTY_CLOB()
                where suny_id = :suny_id
                returning user_info into :user_info";
        } else {
            $update_qry = "update HRFORMS2_USERS 
                set refresh_date = sysdate, user_info = '{}'
                where suny_id = :suny_id
                returning user_info into :user_info";
        }
        $update_stmt = oci_parse($this->db,$update_qry);
        $clob = oci_new_descriptor($this->db, OCI_D_LOB);
        oci_bind_by_name($update_stmt,":suny_id", $this->req[0]);	
        oci_bind_by_name($update_stmt,":user_info", $clob, -1, OCI_B_CLOB);
        $r = oci_execute($update_stmt,OCI_NO_AUTO_COMMIT);
        if (!$r) $this->raiseError();
        $clob->save(json_encode($data));
        oci_commit($this->db);
        oci_free_statement($update_stmt);
        return;
    }

    /**
     * validate called from init()
     */
    function validate() {
        if (!isset($this->req[0]) && !$this->sessionData['isAdmin']) $this->raiseError(E_BAD_REQUEST,array("errMsg"=>"SUNY ID is required"));
        //need to allow non-admin users to query user data
        //if ($this->method != "GET" && !$this->sessionData['isAdmin']) $this->raiseError(403);
        if ($this->method == 'PUT' && !isset($this->req[0])) $this->raiseError(E_BAD_REQUEST,array("errMsg"=>"SUNY ID is required"));
    }

    /* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
    function GET() {
        if (!isset($this->req[0])) { // get all users
            $qry = "select u.suny_id, p.*,
                u.suny_id as user_suny_id, u.created_date, u.created_by, u.start_date, u.end_date,
                to_char(u.refresh_date,'dd-MON-yy hh:mi:ss AM') as refresh_date,
                d.group_id, g.group_name, nvl(u.user_options.notifications,'N') as notifications, 
                nvl(u.user_options.viewer,'N') as viewer
            from hrforms2_users u
            left join (select distinct ".$this->BASE_PERSEMP_FIELDS." from buhr.buhr_persemp_mv@banner.cc.binghamton.edu) p on (u.suny_id = p.sunyhr_suny_id)
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
        } else { //get one user
            $existing = false;
            $qry = "select suny_id, to_char(end_date,'DD-MON-YYYY HH24:MI') as end_date,
                to_char(refresh_date,'DD-MON-YYYY HH:MI:SS AM') as refresh_date, user_info, user_options
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
            
            if (!$existing) { // User does not exist
                $this->_arr = $this->getSUNYHRUser();
                if (!$this->_arr) {
                    //if (!$this->retJSON) return;
                    $this->raiseError(E_BAD_REQUEST,array('errMsg'=>'SUNY ID Not Found'));
                }
            } else { // User exists
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
                    if ($user['USER_INFO'] != '' && $user['USER_INFO'] != '{}') { // user has user_info
                        $this->_arr = json_decode($user['USER_INFO'], true);
                        $this->_arr['REFRESH_DATE'] = $user['REFRESH_DATE'];
                        $this->_arr['CACHED_DATA'] = true;
                    } else { // user does not have user_info
                        if ($end_diff > 259200) { // user ended more than 6 months ago
                                if (!$this->retJSON) return;
                                // User is Inactive, does not have user_info, and was ended more than 6 months ago.
                                $message = "The SUNY ID <strong>" . $this->req[0] . "</strong> does not have cached information and was ended more than 6 months ago.  Will not update cached information";
                                $this->sendError($message,'HRForms2 Error: Old User With No Data','general');
                                $this->raiseError(E_NOT_FOUND);	
                        } else {
                            $this->_arr = $this->getSUNYHRUser();
                            if (!$this->_arr) {
                                // User is Inactive, does not have user_info, and does not have SUNY HR data; User DNE
                                if (!$this->retJSON) return;
                                $message = "The SUNY ID <strong>" . $this->req[0] . "</strong> does not exist in SUNY HR, but exists in HRForms2.  Cannot update cached information.";
                                $this->sendError($message,'HRForms2 Error: Missing SUNY ID in SUNY HR','general');
                                $this->raiseError(E_NOT_FOUND);
                            } else {
                                if (!isset($this->_arr['SUNY_ID'])) $this->_arr['SUNY_ID'] = $this->_arr['SUNYHR_SUNY_ID'];
                                $this->updateUserInfo($this->_arr);
                                $this->_arr['REFRESH_DATE'] = date('d-M-y h:i:s A', time());
                                $this->_arr['CACHED_DATA'] = false;
                            }
                        }
                    }

                // User is Active
                } else {
                    // check refresh date
                    $settings = (new settings(array(),false))->returnData;
                    $refresh_date = DateTime::createFromFormat('d-M-Y h:i:s A',$user['REFRESH_DATE']);
                    $refresh_diff = $settings['general']['userRefresh']+1;
                    if ($user['REFRESH_DATE']) {
                        $diff = $refresh_date->diff($now);
                        $refresh_diff = ($diff->invert == 1)?$diff->days*-1:$diff->days;
                        $userInfo = json_decode($user['USER_INFO'],true);
                        if ($user['USER_INFO'] == "" || !array_key_exists('SUNY_ID',$userInfo)) $refresh_diff = $settings['general']['userRefresh']+1;
                    }
                    
                    if ($refresh_diff > $settings['general']['userRefresh']) { // user_info is "stale" or missing
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
                                $this->sendError($message,'HRForms2 Error: User Deactivated','general');
                            }
                            $this->_arr = json_decode($user['USER_INFO'], true);
                        } else { // update cached data and refresh date	
                            if (!isset($this->_arr['SUNY_ID'])) $this->_arr['SUNY_ID'] = $this->_arr['SUNYHR_SUNY_ID'];
                            $this->updateUserInfo($this->_arr);
                            $this->_arr['REFRESH_DATE'] = date('d-M-y h:i:s A', time());
                            $this->_arr['CACHED_DATA'] = false;
                        }
                    } else { // user_info is "fresh"
                        $this->_arr = json_decode($user['USER_INFO'], true);
                        $this->_arr['REFRESH_DATE'] = $user['REFRESH_DATE'];
                        $this->_arr['CACHED_DATA'] = true;
                    }
                }
            }
            $this->_arr['USER_OPTIONS'] = ($user) ? json_decode($user['USER_OPTIONS']) : '{"notifications":"n"}';

            $this->returnData = array((array)$this->_arr); // Need to cast as array instead of object
            if ($this->retJSON) $this->toJSON($this->returnData);
        }
    }

    function PUT() {
        if (array_key_exists('refresh',$this->POSTvars)) {
            $data = $this->getSUNYHRUser();
            $this->updateUserInfo($data);
            $this->done();
            return;
        }
        $qry = "update hrforms2_users 
            set start_date = :start_date, 
            end_date = :end_date,
            refresh_date = NULL,
            user_options = " . ((INSTANCE=='LOCAL')?"'{}'":'EMPTY_CLOB()') . "
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
        new userdepts(array($this->POSTvars['SUNY_ID']));
        $this->done();
    }

    function POST() {
        $options = json_encode($this->POSTvars['OPTIONS']);
        $qry = "insert into hrforms2_users values(:suny_id, sysdate, :created_by, :start_date, :end_date, null, '[]', :options) returning user_info into :user_info";
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
        $this->done();
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
