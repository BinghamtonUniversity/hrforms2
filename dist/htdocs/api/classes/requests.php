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
    private $conditions = array();
    private $match = array();

	function __construct($req,$rjson=true) {
		$this->allowedMethods = "GET"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
		$this->reqAuth = true; //default: true - NB: See note above
		$this->retJSON = $rjson;
		$this->req = $req;
		$this->init();
	}

    private function checkSkip($wf_id,$seq) {
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $wf = (new workflow(array('request',$wf_id),false))->returnData[0];
        $this->conditions = array_filter($wf['CONDITIONS'],function($c) use($seq){
            return strval($c->seq) == strval($seq);
        });
        if ($this->conditions) {
            $accounts = array_map(function($account) {return $account['account'][0]['id'];},$this->POSTvars['SUNYAccounts']);
            $this->match = array_filter($accounts,function($account) {
                foreach ($this->conditions as $condition) {
                    switch($condition->field_name) {
                        case "suny_account":
                            switch($condition->field_operator) {
                                case "eq": return $account != $condition->field_value;
                                case "ne": return $account == $condition->field_value;
                                case "sw": return substr($account, 0, strlen($condition->field_value)) != $condition->field_value;
                                case "ns": return substr($account, 0, strlen($condition->field_value)) == $condition->field_value;
                            }
                            break;
                    }
                }
            });
        }
    }

	/**
	 * validate called from init()
	 */
	function validate() {
		if ($this->method == 'DELETE' && $this->req[1] != $this->sessionData['EFFECTIVE_SUNY_ID']) $this->raiseError(E_FORBIDDEN);
		//if ($this->method == 'POST' && $this->req[1] != $this->sessionData['EFFECTIVE_SUNY_ID']) $this->raiseError(E_FORBIDDEN);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
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
            $qry = "select REQUEST_DATA from HRFORMS2_REQUESTS where REQUEST_ID = :request_id";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":request_id",$this->req[0]);
            $r = oci_execute($stmt);
			if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
            $this->_arr['REQUEST_DATA'] = (is_object($row['REQUEST_DATA'])) ? $row['REQUEST_DATA']->load() : "";
            oci_free_statement($stmt);
			$this->returnData = json_decode($this->_arr['REQUEST_DATA']);
	        if ($this->retJSON) $this->toJSON($this->returnData);		    
        }
	}

    function POST() {
        //TODO: should this be part of the URL?
        //POST: https://{domain}/api/api.php/requests/draft/... (eq action=="save")
        //POST: https://{domain}/api/api.php/requests/submit/12
        //POST: https://{domain}/api/api.php/requests/approve/12
        //POST: https://{domain}/api/api.php/requests/reject/12
        
        switch($this->POSTvars['action']) {
            case "submit":
                $journal_array = array("S");
    
                // get user's group
                $_SERVER['REQUEST_METHOD'] = 'GET';
                $user = (new user(array($this->sessionData['EFFECTIVE_SUNY_ID']),false))->returnData[0];
                $group = $this->getGroupIds($user['REPORTING_DEPARTMENT_CODE']);
    
                //get hierarchy for group
                $h = (new hierarchy(array('request','group',$group['GROUP_ID']),false))->returnData;
                $idx = array_search($this->POSTvars['posType']['id'],array_column($h,'POSITION_TYPE'));
                if($idx == -1) $this->raiseError(); //TODO: handle error
                $hierarchy = $h[$idx];
                $groups = $hierarchy['GROUPS'];
                $groups_array = explode(",",$groups);
                
                // Check for skip conditions
                $this->checkSkip($hierarchy['WORKFLOW_ID'],0);

                //extract comments from JSON
                $comment = $this->POSTvars['comment'];
                unset($this->POSTvars['comment']);
    
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
                $this->POSTvars['draftReqId'] = $this->POSTvars['reqId'];
                $this->POSTvars['reqId'] = $request_id;
                unset($this->POSTvars['comment']);
                $request_data->save(json_encode($this->POSTvars));
                oci_commit($this->db);
    
                if (!$this->match && $this->conditions) {
                    array_unshift($journal_array,"X");
                }
    
                $_SERVER['REQUEST_METHOD'] = 'POST';
    
                foreach ($journal_array as $i=>$j) {
                    $request_data = array(
                        'request_id'=>$request_id,
                        'hierarchy_id'=>$hierarchy['HIERARCHY_ID'],
                        'workflow_id'=>$hierarchy['WORKFLOW_ID'],
                        'seq'=>$i,
                        'groups'=>$groups,
                        'group_from'=>$group['GROUP_ID'],
                        'group_to'=>$groups_array[$i],
                        'comment'=>($j=='X')?'':$comment
                    );
                    $this->POSTvars['request_data'] = $request_data;
                    $journal = (new journal(array($request_id,$j,$request_data),false))->returnData;
                }
    
                // delete from hrforms2_requests_drafts (call delete)
                $_SERVER['REQUEST_METHOD'] = 'DELETE';
                $del_draft = (new requests($this->req,false));
    
                //TODO: should the return also have the skipped one?
                $this->toJSON($request_data);
                break;

            case "approve":
                $journal_array = array();

                $_SERVER['REQUEST_METHOD'] = 'GET';
                $journal = (new journal(array($this->POSTvars['reqId']),false))->returnData;
                $last_journal = array_pop($journal);

                $workflow = (new workflow(array('request',$last_journal['WORKFLOW_ID']),false))->returnData[0];

                $groups_array = explode(",",$workflow['GROUPS']);
                $next_seq = intval($last_journal['SEQUENCE'])+1;
                if ($next_seq == sizeof($groups_array)-1) {
                    $journal_array[$next_seq] = 'F';
                } else {
                    $journal_array[$next_seq] = 'A';
                    //check if NEXT is a skip
                    $this->checkSkip($workflow['ID'],$next_seq);
                    if (!$this->match && $this->conditions) {
                        $journal_array[$next_seq] = 'X';
                        $journal_array[$next_seq+1] = ($next_seq+1 == sizeof($groups_array)-1)?'F':'A';
                    }
                }

                $_SERVER['REQUEST_METHOD'] = 'POST';
                foreach ($journal_array as $i=>$j) {
                    $request_data = array(
                        'request_id'=>$this->POSTvars['reqId'],
                        'hierarchy_id'=>$last_journal['HIERARCHY_ID'],
                        'workflow_id'=>$last_journal['WORKFLOW_ID'],
                        'seq'=>$i,
                        'groups'=>$workflow['GROUPS'],
                        'group_from'=>$groups_array[$last_journal['SEQUENCE']],
                        'group_to'=>$groups_array[$i],
                        'comment'=>($j=='X')?'':$this->POSTvars['comment']
                    );
                    $journal = (new journal(array($this->POSTvars['reqId'],$j,$request_data),false))->returnData;
                }

                $this->toJSON($request_data);
                break;

            case "reject":
            
            case "save":
                //Limit number of drafts a user may have; to prevent "SPAMMING"
                $qry = "select count(*) from HRFORMS2_REQUESTS_DRAFTS where SUNY_ID = :suny_id";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt, ":suny_id", $this->sessionData['EFFECTIVE_SUNY_ID']);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                $row = oci_fetch_array($stmt,OCI_ARRAY+OCI_RETURN_NULLS);
                oci_free_statement($stmt);
                if ($row[0] > MAX_DRAFTS) {
                    $this->raiseError(E_TOO_MANY_DRAFTS);
                    return;
                }
                $unix_ts = time();
                $reqId = 'draft-'.$this->sessionData['EFFECTIVE_SUNY_ID'].'-'.$unix_ts;
                $this->POSTvars['reqId'] = $reqId;
                //TODO: need to modify POSTvars to use new assigned draft ID; don't use the assigned code... assigned could just be "draft"?
                $qry = "insert into HRFORMS2_REQUESTS_DRAFTS values(:suny_id, :unix_ts, EMPTY_CLOB()) returning DATA into :data";
                $stmt = oci_parse($this->db,$qry);
                $clob = oci_new_descriptor($this->db, OCI_D_LOB);
                oci_bind_by_name($stmt, ":suny_id", $this->sessionData['EFFECTIVE_SUNY_ID']);
                oci_bind_by_name($stmt, ":unix_ts", $unix_ts);
                oci_bind_by_name($stmt, ":data", $clob, -1, OCI_B_CLOB);
                $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
                if (!$r) $this->raiseError();
                $clob->save(json_encode($this->POSTvars));
                oci_commit($this->db);
                if ($this->retJSON) $this->toJSON(array('reqId'=>$reqId));
                break;

            default:
                $this->raiseError(E_BAD_REUQEST);
        }
        return;

        //TODO: need to handle out of range on groups
        if ($this->POSTvars['action'] == 'submit') {
            $journal_array = array("S");
            $match = array();
            $conditions = array();

            // get user's group
            $_SERVER['REQUEST_METHOD'] = 'GET';
            $user = (new user(array($this->sessionData['EFFECTIVE_SUNY_ID']),false))->returnData[0];
            $group = $this->getGroupIds($user['REPORTING_DEPARTMENT_CODE']);

            //get hierarchy for group
            $h = (new hierarchy(array('request','group',$group['GROUP_ID']),false))->returnData;
            $idx = array_search($this->POSTvars['posType']['id'],array_column($h,'POSITION_TYPE'));
            if($idx == -1) $this->raiseError(); //TODO: handle error
            $hierarchy = $h[$idx];
            $groups = $hierarchy['GROUPS'];
            // get next group to
            $groups_array = explode(",",$groups);
            
            // Check for skip conditions
            $wf = (new workflow(array('request',$hierarchy['WORKFLOW_ID']),false))->returnData[0];
            $conditions = array_filter($wf['CONDITIONS'],function($c) {return strval($c->seq) == "0";});
            if (sizeof($conditions) != 0) {
                //collect the account numbers
                $accounts = array_map(function($account) {return $account['account'][0]['id'];},$this->POSTvars['SUNYAccounts']);
                // for each account test against each condition
                $match = array_filter($accounts,function($account) use($conditions) {
                    foreach ($conditions as $condition) {
                        switch($condition->field_name) {
                            case "suny_account":
                                switch($condition->field_operator) {
                                    case "eq": return $account != $condition->field_value;
                                    case "ne": return $account == $condition->field_value;
                                    case "sw": return substr($account, 0, strlen($condition->field_value)) != $condition->field_value;
                                    case "ns": return substr($account, 0, strlen($condition->field_value)) == $condition->field_value;
                                }
                                break;
                        }
                    }
                });
            }

            //extract comments from JSON
            $comment = $this->POSTvars['comment'];

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
            $this->POSTvars['draftReqId'] = $this->POSTvars['reqId'];
            $this->POSTvars['reqId'] = $request_id;
            unset($this->POSTvars['comment']);
            $request_data->save(json_encode($this->POSTvars));
            oci_commit($this->db);

            if (!$match && $conditions) {
                array_unshift($journal_array,"X");
            }

            $_SERVER['REQUEST_METHOD'] = 'POST';

            foreach ($journal_array as $i=>$j) {
                $request_data = array(
                    'request_id'=>$request_id,
                    'hierarchy_id'=>$hierarchy['HIERARCHY_ID'],
                    'workflow_id'=>$hierarchy['WORKFLOW_ID'],
                    'seq'=>$i,
                    'groups'=>$groups,
                    'group_from'=>$group['GROUP_ID'],
                    'group_to'=>$groups_array[$i],
                    'comment'=>$comment
                );
                $this->POSTvars['request_data'] = $request_data;
                $journal = (new journal(array($request_id,$j,$request_data),false))->returnData;
            }

            // delete from hrforms2_requests_drafts (call delete)
            $_SERVER['REQUEST_METHOD'] = 'DELETE';
            $del_draft = (new requests($this->req,false));

            //TODO: should the return also have the skipped one?
            $this->toJSON($request_data);

        /* HANDLE APPROVALS */
        } else if ($this->POSTvars['action'] == 'approve') {
            //get hierarchy info based on reqId
            //TODO: need to handle end of WF chain (i.e. final appove and archive)
            //TODO: get skips; if condition indicates a skip, get next index.

            $_SERVER['REQUEST_METHOD'] = 'GET';
            $journal = (new journal(array($this->POSTvars['REQUEST_ID']),false))->returnData;
            $last_journal = $journal[count($journal)-1];

            $workflow = (new workflow(array($last_journal['WORKFLOW_ID']),false))->returnData[0];

            $groups_array = explode(",",$workflow['GROUPS']);
            $next_seq = intval($last_journal['SEQUENCE'])+1;

            $request_data = array(
                'request_id'=>$this->POSTvars['REQUEST_ID'],
                'hierarchy_id'=>$last_journal['HIERARCHY_ID'],
                'workflow_id'=>$last_journal['WORKFLOW_ID'],
                'seq'=>$next_seq,
                'groups'=>$workflow['GROUPS'],
                'group_from'=>$groups_array[$last_journal['SEQUENCE']],
                'group_to'=>$groups_array[$next_seq],
                'comment'=>$this->POSTvars['comment']
            );

            // insert into hrforms2_requests_journal
            $_SERVER['REQUEST_METHOD'] = 'POST';
            $journal = (new journal(array($this->POSTvars['REQUEST_ID'],'A',$request_data),false))->returnData;

            $this->toJSON($request_data);

        /* HANDLE REJECTION */
        } else if ($this->POSTvars['action'] == 'reject') {
            $_SERVER['REQUEST_METHOD'] = 'GET';
            $journal = (new journal(array($this->POSTvars['REQUEST_ID']),false))->returnData;
            $last_journal = $journal[count($journal)-1];

            $workflow = (new workflow(array($last_journal['WORKFLOW_ID']),false))->returnData[0];

            $groups_array = explode(",",$workflow['GROUPS']);
            $next_seq = intval($last_journal['SEQUENCE'])+1;

            $request_data = array(
                'request_id'=>$this->POSTvars['REQUEST_ID'],
                'hierarchy_id'=>$last_journal['HIERARCHY_ID'],
                'workflow_id'=>$last_journal['WORKFLOW_ID'],
                'seq'=>$next_seq,
                'groups'=>$workflow['GROUPS'],
                'group_from'=>$groups_array[$last_journal['SEQUENCE']],
                'group_to'=>null,
                'comment'=>$this->POSTvars['comment']
            );

            // insert into hrforms2_requests_journal
            $_SERVER['REQUEST_METHOD'] = 'POST';
            $journal = (new journal(array($this->POSTvars['REQUEST_ID'],'R',$request_data),false))->returnData;

            $this->toJSON($request_data);

        /* New Draft */
        } else {
            //Limit number of drafts a user may have; to prevent "SPAMMING"
            $qry = "select count(*) from HRFORMS2_REQUESTS_DRAFTS where SUNY_ID = :suny_id";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['EFFECTIVE_SUNY_ID']);
            $r = oci_execute($stmt);
			if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_ARRAY+OCI_RETURN_NULLS);
            oci_free_statement($stmt);
            if ($row[0] > MAX_DRAFTS) {
                $this->raiseError(E_TOO_MANY_DRAFTS);
                return;
            }
            $unix_ts = time();
            $reqId = 'draft-'.$this->sessionData['EFFECTIVE_SUNY_ID'].'-'.$unix_ts;
            $this->POSTvars['reqId'] = $reqId;
            //TODO: need to modify POSTvars to use new assigned draft ID; don't use the assigned code... assigned could just be "draft"?
            $qry = "insert into HRFORMS2_REQUESTS_DRAFTS values(:suny_id, :unix_ts, EMPTY_CLOB()) returning DATA into :data";
            $stmt = oci_parse($this->db,$qry);
            $clob = oci_new_descriptor($this->db, OCI_D_LOB);
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['EFFECTIVE_SUNY_ID']);
            oci_bind_by_name($stmt, ":unix_ts", $unix_ts);
            oci_bind_by_name($stmt, ":data", $clob, -1, OCI_B_CLOB);
            $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
            if (!$r) $this->raiseError();
            $clob->save(json_encode($this->POSTvars));
            oci_commit($this->db);
            if ($this->retJSON) $this->toJSON(array('reqId'=>$reqId));
        }
    }

    function PUT() {
        if ($this->req[0] == 'draft') {
            $qry = "update HRFORMS2_REQUESTS_DRAFTS set data = EMPTY_CLOB() 
                where SUNY_ID = :suny_id and unix_ts = :unix_ts
                returning DATA into :data";
            $stmt = oci_parse($this->db,$qry);
            $clob = oci_new_descriptor($this->db, OCI_D_LOB);
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['EFFECTIVE_SUNY_ID']);
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
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['EFFECTIVE_SUNY_ID']);
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
