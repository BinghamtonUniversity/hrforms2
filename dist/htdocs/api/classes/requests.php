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
		$this->allowedMethods = "GET,POST,PUT,DELETE"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
		$this->reqAuth = true; //default: true - NB: See note above
		$this->retJSON = $rjson;
		$this->req = $req;
		$this->init();
	}

    private function checkSkip($wf_id,$seq) {
        if ($wf_id == null || $seq == null) return; // if parameters are missing return
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $wf = (new workflow(array('request',$wf_id),false))->returnData[0];
        if ($wf['CONDITIONS'] == null) return; // if no conditions return; no need to parse
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

    /** check if submitter/approver is in the next group and auto-approve */
    private function autoApproveNext($groups,$seq) {
        // Check if Approver is in next group and auto-approve
        if ($seq >= sizeof($groups)-1) return false; // do not auto-approve last group.
        $groupusers = (new groupusers(array($groups[$seq]),false))->returnData;
        foreach ($groupusers as $u) {
            if ($u['SUNY_ID'] == $this->sessionData['EFFECTIVE_SUNY_ID']) {
                return true;
            }
        }
        return false;
    }    

	/**
	 * validate called from init()
	 */
	function validate() {
		if ($this->method == 'DELETE' && $this->req[0] == 'draft' && $this->req[1] != $this->sessionData['EFFECTIVE_SUNY_ID']) $this->raiseError(E_FORBIDDEN);
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
            // Validation: Only submitter and group assigned to should view request
            $usergroups = (new usergroups(array($this->sessionData['EFFECTIVE_SUNY_ID']),false))->returnData;
            $journal = (new journal(array('request',$this->req[0]),false))->returnData;
            $submitter = array_shift($journal);
            $last_journal = (count($journal) == 0)?$submitter:array_pop($journal);
            unset($last_journal['COMMENTS']); // We don't need commments
            if (!(in_array($last_journal['GROUP_TO'],array_column($usergroups,'GROUP_ID'))) && 
                !($submitter['SUNY_ID'] == $this->sessionData['EFFECTIVE_SUNY_ID'])) {
                    $this->raiseError(403);
            }
            $qry = "select REQUEST_DATA from HRFORMS2_REQUESTS where REQUEST_ID = :request_id";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":request_id",$this->req[0]);
            $r = oci_execute($stmt);
			if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
            $this->_arr['REQUEST_DATA'] = (is_object($row['REQUEST_DATA'])) ? $row['REQUEST_DATA']->load() : "";
            oci_free_statement($stmt);
			$this->returnData = json_decode($this->_arr['REQUEST_DATA']);
            $this->returnData->submittedBy = $submitter['SUNY_ID'];
            $this->returnData->lastJournal = $last_journal;
	        if ($this->retJSON) $this->toJSON($this->returnData);
        }
	}

    function POST() {
        switch($this->req[0]) {
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

            case "resubmit":
                // check settings to see if "resubmit" is enabled.
                $_SERVER['REQUEST_METHOD'] = 'GET';
                $settings = (new settings(array(),false))->returnData;
                if (!$settings['requests']['menu']['rejections']['resubmit']) $this->raiseError(E_FORBIDDEN);
                
                // Update existing Journal extries to be negative sequence then proceed to submit case
                $max = $this->POSTvars['lastJournal']['SEQUENCE'];
                $request_id = $this->POSTvars['reqId'];
                $qry = "update HRFORMS2_REQUESTS_JOURNAL
                    set sequence = sequence - (:max + 1)
                    where request_id = :request_id";
                    $stmt = oci_parse($this->db,$qry);
                    oci_bind_by_name($stmt,":max", $max);
                    oci_bind_by_name($stmt,":request_id", $request_id);
                    $r = oci_execute($stmt);
                    if (!$r) $this->raiseError();
                    oci_free_statement($stmt);

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
                array_unshift($groups_array,"-99");

                // Check for skip conditions
                $this->checkSkip($hierarchy['WORKFLOW_ID'],0);
                if (!$this->match && $this->conditions) array_push($journal_array,"X");

                // Check if submitter is in next approval group and auto-approve
                if ($this->autoApproveNext($groups_array,sizeof($journal_array))) {
                    array_push($journal_array,'A');
                    array_push($comments_array,"Auto Approved - Submitter in approval group");
                }
                
                //extract comments from JSON
                $comment = $this->POSTvars['comment'];
                unset($this->POSTvars['comment']);
    
                // Add workflowId and groups to formdata
                $this->POSTvars['WORKFLOW_ID'] = $hierarchy['WORKFLOW_ID'];
                $this->POSTvars['GROUPS'] = implode(',',$groups_array);

                if ($this->req[0] == "submit") {
                    // insert into hrforms2_request (get request id);
                    $qry = "insert into HRFORMS2_REQUESTS 
                    values(HRFORMS2_REQUEST_ID_SEQ.nextval,EMPTY_CLOB(),sysdate,EMPTY_CLOB()) 
                    returning REQUEST_ID, CREATED_BY, REQUEST_DATA into :request_id, :created_by, :request_data";
                    $stmt = oci_parse($this->db,$qry);
                    $created_by = oci_new_descriptor($this->db, OCI_D_LOB);
                    $request_data = oci_new_descriptor($this->db, OCI_D_LOB);
                    oci_bind_by_name($stmt,":request_id", $request_id,-1,SQLT_INT);
                    oci_bind_by_name($stmt,":created_by", $created_by, -1, OCI_B_CLOB);
                    oci_bind_by_name($stmt,":request_data", $request_data, -1, OCI_B_CLOB);
                    $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
                    if (!$r) $this->raiseError();
                    $created_by->save(json_encode($user));
                    $this->POSTvars['draftReqId'] = $this->POSTvars['reqId'];
                    $this->POSTvars['reqId'] = $request_id;
                    $request_data->save(json_encode($this->POSTvars));
                    oci_commit($this->db);
                }

                // Append PA/PF to $journal_array
                array_push($journal_array,(sizeof($journal_array)==sizeof($groups_array)-1)?'PF':'PA');

                // Post to Journal
                $_SERVER['REQUEST_METHOD'] = 'POST';
                $return_data = array("journal"=>[],"email_response"=>[]);
                foreach ($journal_array as $i=>$j) {
                    if ($j == 'X') $comment = 'Skipped by hierarchy rule';
                    if ($j == 'PA') $comment = '';
                    if ($j == 'PF') $comment = '';
                    $data = array(
                        'status'=>$j,
                        'request_id'=>$request_id,
                        'hierarchy_id'=>$hierarchy['HIERARCHY_ID'],
                        'workflow_id'=>$hierarchy['WORKFLOW_ID'],
                        'seq'=>$i,
                        'groups'=>$groups,
                        'group_from'=>'-99',
                        'group_to'=>$groups_array[$i],
                        'submitted_by'=>$user['SUNY_ID'],
                        'comment'=>$comment
                    );
                    $return_data['journal'][] = $data;
                    $this->POSTvars['journal_data'] = $data;
                    $journal = (new journal(array('request',$request_id,$j,$data),false))->returnData;
                    
                    // Email Notification
                    $return_data['email_response'][$j] = $this->sendEmail($data);
                }

                if ($this->req[0] == "submit") {
                    // delete from hrforms2_requests_drafts (call delete)
                    if (isset($this->req[3])) { //only delete from drafts if it was saved
                        $_SERVER['REQUEST_METHOD'] = 'DELETE';
                        array_shift($this->req);
                        $del_draft = (new requests($this->req,false));
                    }
                }

                $this->toJSON($return_data);
                break;

            case "approve":
                $journal_array = array();

                $_SERVER['REQUEST_METHOD'] = 'GET';
                $journal = (new journal(array('request',$this->POSTvars['reqId']),false))->returnData;
                $last_journal = array_pop($journal);

                $workflow = (new workflow(array('request',$last_journal['WORKFLOW_ID']),false))->returnData[0];
                $groups_array = explode(",",$workflow['GROUPS']);

                $next_seq = intval($last_journal['SEQUENCE'])+1;

                // Check for skip condition
                $this->checkSkip($workflow['WORKFLOW_ID'],$last_journal['SEQUENCE']);
                if (!$this->match && $this->conditions) {
                    $next_seq += 1;
                    array_push($journal_array,'X');
                }

                // Check if submitter is in next approval group and auto-approve
                if ($this->autoApproveNext($groups_array,sizeof($journal_array))) {
                    array_push($journal_array,'A');
                    array_push($comments_array,"Auto Approved - Submitter in approval group");
                }

                //extract comments from JSON
                $comment = $this->POSTvars['comment'];
                unset($this->POSTvars['comment']);

                // Set next status
                array_push($journal_array,($next_seq==sizeof($groups_array))?'PF':'PA');

                // Update current journal entry from PA/PF to A/F
                $_SERVER['REQUEST_METHOD'] = 'PATCH';
                $jrnl_update = (new journal(array(
                    'request',
                    $this->POSTvars['reqId'],
                    $last_journal['SEQUENCE'],
                    $last_journal['STATUS'],
                    ($last_journal['STATUS']=='PF')?'Z':'A', //TODO: need to handle if last
                    $comment
                ),false))->returnData;

                // Post to Journal
                $_SERVER['REQUEST_METHOD'] = 'POST';
                $return_data = array("journal"=>[],"email_response"=>[]);
                foreach ($journal_array as $i=>$j) {
                    if ($j == 'X') $comment = 'Skipped by hierarchy rule';
                    if ($j == 'PA') $comment = '';
                    if ($j == 'PF') $comment = '';
                    $seq = $next_seq - sizeof($journal_array) + 1 + $i;
                    $data = array(
                        'status'=>$j,
                        'request_id'=>$this->POSTvars['reqId'],
                        'hierarchy_id'=>$last_journal['HIERARCHY_ID'],
                        'workflow_id'=>$last_journal['WORKFLOW_ID'],
                        'seq'=>$seq,
                        'groups'=>$workflow['GROUPS'],
                        'group_from'=>$groups_array[$last_journal['SEQUENCE']-1],
                        'group_to'=>$groups_array[$seq-1],
                        'submitted_by'=>$last_journal['CREATED_BY_SUNY_ID'],
                        'comment'=>$comment
                    );
                    $return_data['journal'][] = $data;
                    $this->POSTvars['journal_data'] = $data;
                    $journal = (new journal(array('request',$this->POSTvars['reqId'],$j,$data),false))->returnData;

                    // Email Notification
                    $return_data['email_response'][$j] = $this->sendEmail($data);

                }

                $this->toJSON($return_data);
                break;

            case "reject":
                // check settings to see if "rejection" is enabled.
                $_SERVER['REQUEST_METHOD'] = 'GET';
                $settings = (new settings(array(),false))->returnData;
                if (!$settings['requests']['menu']['rejections']['enabled']) $this->raiseError(E_FORBIDDEN);

                $journal = (new journal(array('request',$this->POSTvars['reqId']),false))->returnData;
                $last_journal = array_pop($journal);

                $groups_array = explode(',',$this->POSTvars['GROUPS']);

                $seq = intval($last_journal['SEQUENCE'])-1;

                //extract comments from JSON
                $comment = $this->POSTvars['comment'];
                unset($this->POSTvars['comment']);

                // Update current journal entry to R
                $_SERVER['REQUEST_METHOD'] = 'PATCH';
                /*$jrnl_update = (new journal(array(
                    'request',
                    $this->POSTvars['reqId'],
                    $seq,
                    $last_journal['STATUS'],
                    'R',
                    $comment
                ),false))->returnData;*/

                $return_data = array(
                    "journal"=>array(
                        'status'=>'R',
                        'request_id'=>$this->POSTvars['reqId'],
                        'hierarchy_id'=>$last_journal['HIERARCHY_ID'],
                        'workflow_id'=>$last_journal['WORKFLOW_ID'],
                        'seq'=>$seq,
                        'groups'=>$this->POSTvars['GROUPS'],
                        'group_from'=>($seq==0)?'-99':$groups_array[$seq-1],
                        'group_to'=>$groups_array[$seq],
                        'submitted_by'=>$last_journal['CREATED_BY_SUNY_ID'],
                        'comment'=>$comment
                    ),
                    "email_response"=>[]
                );

                // Email Notification
                //$return_data['email_response'] = $this->sendEmail($return_data['journal']);

                $this->toJSON($return_data);
                break;

            case "final":
                $_SERVER['REQUEST_METHOD'] = 'GET';
                $journal = (new journal(array('request',$this->POSTvars['reqId']),false))->returnData;
                $last_journal = array_pop($journal);

                $groups_array = explode(',',$this->POSTvars['GROUPS']);

                $seq = intval($last_journal['SEQUENCE'])-1;

                //extract comments from JSON
                $comment = $this->POSTvars['comment'];
                unset($this->POSTvars['comment']);
                
                // Update current to 'Z'
                $_SERVER['REQUEST_METHOD'] = 'PATCH';
                $jrnl_update = (new journal(array(
                    'request',
                    $this->POSTvars['reqId'],
                    $seq,
                    $last_journal['STATUS'],
                    'Z',
                    $comment
                ),false))->returnData;
                
                // Move Request and Request_Journal to archive
                $_SERVER['REQUEST_METHOD'] = 'POST';
                $archive = (new archive(array('request',$this->POSTvars['reqId']),false))->returnData;
                
                $return_data = array(
                    "journal"=>array(
                        'status'=>'Z',
                        'request_id'=>$this->POSTvars['reqId'],
                        'hierarchy_id'=>$last_journal['HIERARCHY_ID'],
                        'workflow_id'=>$last_journal['WORKFLOW_ID'],
                        'seq'=>$seq,
                        'groups'=>$this->POSTvars['GROUPS'],
                        'group_from'=>$groups_array[$seq-1],
                        'group_to'=>$groups_array[$seq],
                        'submitted_by'=>$last_journal['CREATED_BY_SUNY_ID'],
                        'comment'=>$comment
                    ),
                    "email_response"=>[]
                );

                // Email Notification
                $return_data['email_response'] = $this->sendEmail($return_data['journal']);

                $this->toJSON($return_data);

                break;

            default:
                $this->raiseError(E_BAD_REUQEST);
        }
    }

    function PUT() {
        if ($this->req[1] == 'draft') {
            $qry = "update HRFORMS2_REQUESTS_DRAFTS set data = EMPTY_CLOB() 
                where SUNY_ID = :suny_id and unix_ts = :unix_ts
                returning DATA into :data";
            $stmt = oci_parse($this->db,$qry);
            $clob = oci_new_descriptor($this->db, OCI_D_LOB);
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['EFFECTIVE_SUNY_ID']);
            oci_bind_by_name($stmt, ":unix_ts", $this->req[3]);
            oci_bind_by_name($stmt, ":data", $clob, -1, OCI_B_CLOB);
            $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
            if (!$r) $this->raiseError();
            $clob->save(json_encode($this->POSTvars));
            oci_commit($this->db);
            if ($this->retJSON) $this->done();
        } else {
            //TODO: update after submit?  Probably not; should just update data and then approve.
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
            // allow delete of rejected
            // get journal data
            $_SERVER['REQUEST_METHOD'] = 'GET';
            $journal = (new journal(array('request',$this->req[0]),false))->returnData;
            $last_journal = array_pop($journal);
            if ($last_journal['STATUS'] != 'R') $this->raiseError(E_FORBIDDEN);
            $first_journal = array_shift($journal);
            if ($first_journal['SUNY_ID'] != $this->sessionData['EFFECTIVE_SUNY_ID']) $this->raiseError(E_FORBIDDEN);

            $qry = "delete from HRFORMS2_REQUESTS r where r.REQUEST_ID = :request_id and r.CREATED_BY.SUNY_ID = :suny_id";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt, ":request_id", $this->req[0]);
            oci_bind_by_name($stmt, ":suny_id", $this->sessionData['EFFECTIVE_SUNY_ID']);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            oci_commit($this->db);
            if ($this->retJSON) $this->done();
        }
    }
}
