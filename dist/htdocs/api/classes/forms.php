<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Forms extends HRForms2 {
	private $_arr = array();
    private $conditions = array();
    private $match = array();

	function __construct($req,$rjson=true) {
		$this->allowedMethods = "GET, POST, DELETE"; //default: "" - NB: Add methods here: GET, POST, PUT, PATCH, DELETE
		$this->reqAuth = true; //default: true - NB: See note above
		$this->retJSON = $rjson;
		$this->req = $req;
		$this->init();
	}

    private function checkSkip($wf_id,$seq) {
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $wf = (new workflow(array('form',$wf_id),false))->returnData[0];
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
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
        if ($this->req[0] == 'draft') {
            $qry = "select DATA from HRFORMS2_FORMS_DRAFTS where SUNY_ID = :suny_id and UNIX_TS = :unix_ts";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":suny_id",$this->req[1]);
            oci_bind_by_name($stmt,":unix_ts",$this->req[2]);
            $r = oci_execute($stmt);
			if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
            $formData = json_decode((is_object($row['DATA'])) ? $row['DATA']->load() : "");
            oci_free_statement($stmt);
            $qry = "select pt.paytrans_id,pt.tabs 
                FROM HRFORMS2_PAYROLL_TRANSACTIONS pt 
                WHERE pt.paytrans_id = :paytrans_id";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":paytrans_id", $formData->formActions->PAYTRANS_ID);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
            $tabs = (is_object($row['TABS']))?$row['TABS']->load():"";
            $formData->formActions->TABS = json_decode($tabs);
            $this->returnData = $formData;
	        if ($this->retJSON) $this->toJSON($this->returnData);
        } else {
            // Validation: Only submitter and group assigned to should view request
            $usergroups = (new usergroups(array($this->sessionData['EFFECTIVE_SUNY_ID']),false))->returnData;
            $journal = (new journal(array('form',$this->req[0]),false))->returnData;
            $submitter = array_shift($journal);
            $last_journal = (count($journal) == 0)?$submitter:array_pop($journal);
            unset($last_journal['COMMENTS']); // We don't need commments
            if (!(in_array($last_journal['GROUP_TO'],array_column($usergroups,'GROUP_ID'))) && 
                !($submitter['SUNY_ID'] == $this->sessionData['EFFECTIVE_SUNY_ID'])) {
                    $this->raiseError(403);
            }
            $last_journal['SUBMITTER_SUNY_ID'] = $submitter['SUNY_ID'];
            $qry = "select FORM_DATA from HRFORMS2_FORMS where FORM_ID = :form_id";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":form_id",$this->req[0]);
            $r = oci_execute($stmt);
			if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
            $formData = json_decode((is_object($row['FORM_DATA'])) ? $row['FORM_DATA']->load() : "");
            oci_free_statement($stmt);
            $qry = "select pt.paytrans_id,pt.tabs 
                FROM HRFORMS2_PAYROLL_TRANSACTIONS pt 
                WHERE pt.paytrans_id = :paytrans_id";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":paytrans_id", $formData->formActions->PAYTRANS_ID);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
            $tabs = (is_object($row['TABS']))?$row['TABS']->load():"";
            $formData->formActions->TABS = json_decode($tabs);
            $formData->lastJournal = $last_journal;
            $this->returnData = $formData;
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
            case "save":
                //Limit number of drafts a user may have; to prevent "SPAMMING"
                $qry = "select count(*) from HRFORMS2_FORMS_DRAFTS where SUNY_ID = :suny_id";
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
                $formId = 'draft-'.$this->sessionData['EFFECTIVE_SUNY_ID'].'-'.$unix_ts;
                $this->POSTvars['formId'] = $formId;
                //TODO: need to modify POSTvars to use new assigned draft ID; don't use the assigned code... assigned could just be "draft"?
                $qry = "insert into HRFORMS2_FORMS_DRAFTS values(:suny_id, :unix_ts, EMPTY_CLOB()) returning DATA into :data";
                $stmt = oci_parse($this->db,$qry);
                $clob = oci_new_descriptor($this->db, OCI_D_LOB);
                oci_bind_by_name($stmt, ":suny_id", $this->sessionData['EFFECTIVE_SUNY_ID']);
                oci_bind_by_name($stmt, ":unix_ts", $unix_ts);
                oci_bind_by_name($stmt, ":data", $clob, -1, OCI_B_CLOB);
                $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
                if (!$r) $this->raiseError();
                $clob->save(json_encode($this->POSTvars));
                oci_commit($this->db);
                if ($this->retJSON) $this->toJSON(array('formId'=>$formId));
                break;

            case "submit":
                $journal_array = array("S");
    
                // get user's group
                $_SERVER['REQUEST_METHOD'] = 'GET';
                $user = (new user(array($this->sessionData['EFFECTIVE_SUNY_ID']),false))->returnData[0];
                $group = $this->getGroupIds($user['REPORTING_DEPARTMENT_CODE']);

                //get hierarchy for group
                $h = (new hierarchy(array('form','group',$group['GROUP_ID']),false))->returnData;
                $paytransId = $this->POSTvars['formActions']['PAYTRANS_ID'];
                $j = array_filter($h,function($v) use($group,$paytransId) {
                    $hgroups = explode(',',$v['HIERARCHY_GROUPS']);
                    return ($v['PAYTRANS_ID']==$paytransId&&in_array($group['GROUP_ID'],$hgroups));
                });
                if (count($j)<1) $this->raiseError(400);
                $hierarchy = array_shift($j); //get the first record
                $groups = $hierarchy['WORKFLOW_GROUPS'];
                $groups_array = explode(",",$groups);

                // Add User's Dept Group(s) to front of queue if "Send To Group" checked.
                if ($hierarchy['SENDTOGROUP'] == "Y") {
                    $deptGroup = $this->getGroupIds($user['REPORTING_DEPARTMENT_CODE']);
                    $groups_array = array_merge(array_values($deptGroup),$groups_array);
                }

                // TODO: Need to check if user (submitter?) is in first group; 
                //      if yes then skip
                // Check for skip conditions
                $this->checkSkip($hierarchy['WORKFLOW_ID'],0);
    
                //extract comments from JSON
                $comment = $this->POSTvars['comment'];
                unset($this->POSTvars['comment']);

                // Add workflowId and groups to formdata?
                $this->POSTvars['workflowId'] = $hierarchy['WORKFLOW_ID'];
                $this->POSTvars['workflowGroups'] = implode(',',$groups_array);

                // insert into hrforms2_forms (get form id);
                $qry = "insert into HRFORMS2_FORMS 
                values(HRFORMS2_FORM_ID_SEQ.nextval,EMPTY_CLOB(),sysdate,EMPTY_CLOB()) 
                returning FORM_ID, CREATED_BY, FORM_DATA into :form_id, :created_by, :form_data";
                $stmt = oci_parse($this->db,$qry);
                $created_by = oci_new_descriptor($this->db, OCI_D_LOB);
                $form_data = oci_new_descriptor($this->db, OCI_D_LOB);
                oci_bind_by_name($stmt,":form_id", $form_id,-1,SQLT_INT);
                oci_bind_by_name($stmt,":created_by", $created_by, -1, OCI_B_CLOB);
                oci_bind_by_name($stmt,":form_data", $form_data, -1, OCI_B_CLOB);
                $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
                if (!$r) $this->raiseError();
                $created_by->save(json_encode($user));
                $this->POSTvars['draftFormId'] = $this->POSTvars['formId'];
                $this->POSTvars['formId'] = $form_id;
                unset($this->POSTvars['comment']);
                $form_data->save(json_encode($this->POSTvars));
                oci_commit($this->db);
    
                // Handle skips
                //TODO: handle if submitter is in dept approval group
                if (!$this->match && $this->conditions) {
                    array_unshift($journal_array,"X");
                }

                // Post to Journal
                $_SERVER['REQUEST_METHOD'] = 'POST';    
                foreach ($journal_array as $i=>$j) {
                    $journal_data = array(
                        'form_id'=>$form_id,
                        'hierarchy_id'=>$hierarchy['HIERARCHY_ID'],
                        'workflow_id'=>$hierarchy['WORKFLOW_ID'],
                        'seq'=>$i,
                        'groups'=>implode(',',$groups_array),
                        'group_from'=>"",
                        'group_to'=>$groups_array[$i],
                        'comment'=>($j=='X')?'':$comment
                    );
                    $this->POSTvars['journal_data'] = $journal_data;
                    $journal = (new journal(array('form',$form_id,$j,$journal_data),false))->returnData;
                }
    
                // delete from hrforms2_requests_drafts (call delete)
                $_SERVER['REQUEST_METHOD'] = 'DELETE';
                $del_draft = (new forms($this->req,false));
    
                //TODO: should the return also have the skipped one?
                $this->toJSON($journal_data);
                break;

            case "approve":
                $journal_array = array();

                $_SERVER['REQUEST_METHOD'] = 'GET';
                $journal = (new journal(array('form',$this->POSTvars['formId']),false))->returnData;
                $last_journal = array_pop($journal);

                $workflow = (new workflow(array('form',$last_journal['WORKFLOW_ID']),false))->returnData[0];
                /*$groups_array = explode(",",$workflow['GROUPS']);*/
                // Get groups from form data:
                $groups_array = explode(',',$this->POSTvars['GROUPS']);

                $next_seq = intval($last_journal['SEQUENCE'])+1;
                if ($next_seq >= sizeof($groups_array)) {
                    $journal_array[$next_seq] = 'Z';
                } else if ($next_seq == sizeof($groups_array)-1) {
                    $journal_array[$next_seq] = 'F';
                } else {
                    $journal_array[$next_seq] = 'A';
                    //check if NEXT is a skip
                    $this->checkSkip($workflow['WORKFLOW_ID'],$next_seq);
                    if (!$this->match && $this->conditions) {
                        $journal_array[$next_seq] = 'X';
                        $journal_array[$next_seq+1] = ($next_seq+1 == sizeof($groups_array)-1)?'F':'A';
                    }
                }

                $_SERVER['REQUEST_METHOD'] = 'POST'; 
                foreach ($journal_array as $i=>$j) {
                    $journal_data = array(
                        'form_id'=>$this->POSTvars['formId'],
                        'hierarchy_id'=>$last_journal['HIERARCHY_ID'],
                        'workflow_id'=>$last_journal['WORKFLOW_ID'],
                        'seq'=>$i,
                        'groups'=>implode(',',$groups_array),
                        'group_from'=>$groups_array[$last_journal['SEQUENCE']],
                        'group_to'=>$groups_array[$i],
                        'comment'=>($j=='X')?'':$this->POSTvars['comment']
                    );
                    $journal = (new journal(array('form',$this->POSTvars['formId'],$j,$journal_data),false))->returnData;
                    if ($j=='Z') $archive = (new archive(array('form',$this->POSTvars['formId']),false))->returnData;
                }
                $this->toJSON($journal_data);
                break;

            case "reject":
                $_SERVER['REQUEST_METHOD'] = 'GET';
                $journal = (new journal(array('form',$this->POSTvars['FORM_ID']),false))->returnData;
                $last_journal = $journal[count($journal)-1];
    
                $workflow = (new workflow(array('form',$last_journal['WORKFLOW_ID']),false))->returnData[0];
    
                //$groups_array = explode(",",$workflow['GROUPS']);
                // Get groups from form data:
                $groups_array = explode(',',$this->POSTvars['GROUPS']);

                $next_seq = intval($last_journal['SEQUENCE'])+1;
    
                $journal_data = array(
                    'form_id'=>$this->POSTvars['FORM_ID'],
                    'hierarchy_id'=>$last_journal['HIERARCHY_ID'],
                    'workflow_id'=>$last_journal['WORKFLOW_ID'],
                    'seq'=>$next_seq,
                    'groups'=>implode(',',$groups_array),
                    'group_from'=>$groups_array[$last_journal['SEQUENCE']],
                    'group_to'=>null,
                    'comment'=>$this->POSTvars['comment']
                );
    
                // insert into hrforms2_forms_journal
                $_SERVER['REQUEST_METHOD'] = 'POST';
                $journal = (new journal(array('form',$this->POSTvars['FORM_ID'],'R',$journal_data),false))->returnData;
    
                $this->toJSON($journal_data);
                break;

            default:
                var_dump($this->POSTvars);
                $this->raiseError(E_BAD_REQUEST);

        }
    }

    function PUT() {
        if ($this->req[0] == 'draft') {
            $qry = "update HRFORMS2_FORMS_DRAFTS set data = EMPTY_CLOB() 
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
            //TODO: do validation
            $qry = "update HRFORMS2_FORMS set form_data = EMPTY_CLOB() 
                where FORM_ID = :form_id
                returning FORM_DATA into :data";
            $stmt = oci_parse($this->db,$qry);
            $clob = oci_new_descriptor($this->db, OCI_D_LOB);
            oci_bind_by_name($stmt, ":form_id", $this->req[0]);
            oci_bind_by_name($stmt, ":data", $clob, -1, OCI_B_CLOB);
            $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
            if (!$r) $this->raiseError();
            $clob->save(json_encode($this->POSTvars));
            oci_commit($this->db);
            if ($this->POSTvars['action']=='approve'||$this->POSTvars['action']=='reject') {
                $_SERVER['REQUEST_METHOD'] = 'POST';
                $this->POST();
            }
            if ($this->retJSON) $this->done();
        }
    }

    function DELETE() {
        if ($this->req[0] == 'draft') {
            $qry = "delete from HRFORMS2_FORMS_DRAFTS where SUNY_ID = :suny_id and UNIX_TS = :unix_ts";
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
