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
        if ($wf_id == null || $seq == null) return; // if parameters are missing return
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $wf = (new workflow(array('form',$wf_id),false))->returnData[0];
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
        //if ($this->method == 'GET' && sizeof($this->req) != 2) $this->raiseError(E_BAD_REQUEST);
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
            $qry = "select pt.paytrans_id,pt.tabs FROM HRFORMS2_PAYROLL_TRANSACTIONS pt WHERE pt.paytrans_id = :paytrans_id";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":paytrans_id", $formData->formActions->PAYTRANS_ID);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
            $tabs = (is_object($row['TABS']))?$row['TABS']->load():"";
            $formData->formActions->TABS = json_decode($tabs);
        } elseif ($this->req[0] == 'archive') {
            $qry = "select CREATED_BY, FORM_DATA from HRFORMS2_FORMS_ARCHIVE where FORM_ID = :form_id";
            $stmt = oci_parse($this->db,$qry);
            oci_bind_by_name($stmt,":form_id",$this->req[1]);
            $r = oci_execute($stmt);
            if (!$r) $this->raiseError();
            $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
            $formData = json_decode((is_object($row['FORM_DATA'])) ? $row['FORM_DATA']->load() : "");
            $createdByData = json_decode((is_object($row['CREATED_BY'])) ? $row['CREATED_BY']->load() : "");
            $formData->createdBy = $createdByData;
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
            if ($last_journal['STATUS'] != 'Z') {
                $qry = "select CREATED_BY,FORM_DATA from HRFORMS2_FORMS where FORM_ID = :form_id";
                $stmt = oci_parse($this->db,$qry);
                oci_bind_by_name($stmt,":form_id",$this->req[0]);
                $r = oci_execute($stmt);
                if (!$r) $this->raiseError();
                $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
                $formData = json_decode((is_object($row['FORM_DATA'])) ? $row['FORM_DATA']->load() : "");
                $createdByData = json_decode((is_object($row['CREATED_BY'])) ? $row['CREATED_BY']->load() : "");
                $formData->createdBy = $createdByData;
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
            }
            $formData->lastJournal = $last_journal;
        }
        $this->returnData = $formData;
        if ($this->retJSON) $this->toJSON($this->returnData);
	}

    function POST() {
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

            case "resubmit":
                // check settings to see if "resubmit" is enabled.
                $_SERVER['REQUEST_METHOD'] = 'GET';
                $settings = (new settings(array(),false))->returnData;
                if (!$settings['forms']['menu']['rejections']['resubmit']) $this->raiseError(E_FORBIDDEN);
                
                $max = $this->POSTvars['lastJournal']['SEQUENCE'];
                $form_id = $this->POSTvars['formId'];
                $qry = "update HRFORMS2_FORMS_JOURNAL
                    set sequence = sequence - (:max + 1)
                    where form_id = :form_id";
                    $stmt = oci_parse($this->db,$qry);
                    oci_bind_by_name($stmt,":max", $max);
                    oci_bind_by_name($stmt,":form_id", $form_id);
                    $r = oci_execute($stmt);
                    if (!$r) $this->raiseError();
                    oci_free_statement($stmt);

            case "submit":
                $journal_array = array("S");
                $comments_array = array();
    
                // get user's group
                $_SERVER['REQUEST_METHOD'] = 'GET';
                $user = (new user(array($this->sessionData['EFFECTIVE_SUNY_ID']),false))->returnData[0];
                $group = $this->getGroupIds($user['REPORTING_DEPARTMENT_CODE']);

                //get hierarchy for group
                $h = (new hierarchy(array('form','group',$group['GROUP_ID']),false))->returnData;
                //$paytransId = $this->POSTvars['formActions']['PAYTRANS_ID'];
                $idx = array_search($this->POSTvars['formActions']['PAYTRANS_ID'],array_column($h,'PAYTRANS_ID'));
                $message = "";
                if ($idx===false) {
                    // get default (hiearchy_id = 0); if no default raise error
                    $idx = array_search('0',array_column($h,'HIERARCHY_ID'));

                    // TODO: collect key/value pairs to send in message and assign in template or run ob_start in function
                    $message = "<pre>";
                    ob_start();
                    echo "Form ID => " . $this->POSTvars['formId'] ."<br>"; //This is the draft ID, not form ID
                    echo "Effective Date => " . $this->POSTvars['effDate'] . "<br>";
                    print_r($this->POSTvars['formActions']);
                    echo "Comment => " . $this->POSTvars['comment'] . "<br>";
                    $message .= ob_get_contents();
                    ob_end_clean();
                    $message .= "</pre>";
                    $message .= "<p>User Information:</p>";
                    foreach($group as $key => $val) {
                        $message .= "<strong>$key</strong> = ";
                        if (gettype($val) == 'array') {
                            $message .= implode(', ',$val);
                        } else {
                            $message .= $val;
                        }
                        $message .= "<br>";
                    }

                    if ($idx===false) {
                        // send error message
                        $message = "An attempt to submit a Form failed due to no hierarchy and no default routing configured.  Information about the form is below.<br>" . $message;
                        $this->sendError($message,'HRForms2 Error: No Default Form Workflow','forms');
                        $this->raiseError(E_BAD_REQUEST,array('errMsg'=>'No Form Hierarchy Found.  No Default Workflow Set.'));
                    } else {
                        $hierarchy = $h[$idx];
                    }
                } else {
                    $hierarchy = $h[$idx];
                }
                
                /*$j = array_filter($h,function($v) use($group,$paytransId) {
                    //$hgroups = explode(',',$v['HIERARCHY_GROUPS']);
                    return ($v['PAYTRANS_ID']==$paytransId&&in_array($group['GROUP_ID'],$hgroups));
                });
                if (count($j)<1) {
                    //TODO: default route?
                    $this->raiseError(E_BAD_REQUEST,array("errMsg"=>"No hierarchy defined for Form Type")); // no hierarchy
                }*/

                //$hierarchy = array_shift($j); //get the first record

                $groups = $hierarchy['WORKFLOW_GROUPS'];
                $groups_array = explode(",",$groups);

                // Add User's Dept Group(s) to front of queue if "Send To Group" checked.
                if ($hierarchy['SENDTOGROUP'] == "Y") {
                    $deptGroup = $this->getGroupIds($user['REPORTING_DEPARTMENT_CODE']);
                    $groups_array = array_merge(array_values($deptGroup),$groups_array);
                }
                // Add empty value to the beginning of the groups for the "S" record.
                array_unshift($groups_array,"-99");

                //extract comments from JSON
                array_push($comments_array,$this->POSTvars['comment']);
                unset($this->POSTvars['comment']);

                // Add workflowId and groups to formdata
                $this->POSTvars['WORKFLOW_ID'] = $hierarchy['WORKFLOW_ID'];
                $this->POSTvars['GROUPS'] = implode(',',$groups_array);

                if ($this->req[0] == "submit") {
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
                    $form_data->save(json_encode($this->POSTvars));
                    oci_commit($this->db);
                }

                // Check for skip conditions
                $this->checkSkip($hierarchy['WORKFLOW_ID'],0);
                if (!$this->match && $this->conditions) {
                    array_push($journal_array,"X");
                    array_push($comments_array,"Skipped by hierarchy rule");
                }

                // Check if submitter is in next approval group and auto-approve
                if ($this->autoApproveNext($groups_array,sizeof($journal_array))) {
                    array_push($journal_array,'A');
                    array_push($comments_array,"Auto Approved - Submitter in approval group");
                }

                // Append PA/PF to $journal_array
                array_push($journal_array,(sizeof($journal_array)==sizeof($groups_array)-1)?'PF':'PA');
                array_push($comments_array,"");

                // Post to Journal
                $_SERVER['REQUEST_METHOD'] = 'POST';
                $return_data = array("journal"=>[],"email_response"=>[]);
                foreach ($journal_array as $i=>$j) {
                    $data = array(
                        'form_id'=>$form_id,
                        'hierarchy_id'=>$hierarchy['HIERARCHY_ID'],
                        'workflow_id'=>$hierarchy['WORKFLOW_ID'],
                        'seq'=>$i,
                        'groups'=>implode(',',$groups_array),
                        'group_from'=>'-99',
                        'group_to'=>$groups_array[$i],
                        'status'=>$j,
                        'submitted_by'=>$user['SUNY_ID'],
                        'comment'=>$comments_array[$i]
                    );
                    $return_data['journal'][] = $data;
                    $this->POSTvars['journal_data'] = $data;
                    $journal = (new journal(array('form',$form_id,$j,$data),false))->returnData;
                    
                    // Email Notification
                    $return_data['email_response'][$j] = $this->sendEmail($data);
                }

                if ($this->req[0] == "submit") {
                    // delete from hrforms2_forms_drafts
                    if (isset($this->req[3])) { //only delete from drafts if it was saved
                        $_SERVER['REQUEST_METHOD'] = 'DELETE';
                        array_shift($this->req);
                        $del_draft = (new forms($this->req,false));
                    }
                }

                // If Default Hierarchy was used send warning/error message
                if ($message != "") {
                    $message .= "<strong>Form ID:</strong> " . $form_id . "<br>";
                    $message = "A Form was submitted, but there is no hierarchy defined - using default routing.  Information about the form is below.<br>" . $message;
                    $this->sendError($message,'HRForms2 Warning: Default Routing Used For Form','forms');
                }

                $this->toJSON($return_data);
                break;

            case "approve":
                $journal_array = array();
                $comments_array = array();

                $_SERVER['REQUEST_METHOD'] = 'GET';
                $form_id = $this->POSTvars['formId'];
                $journal = (new journal(array('form',$form_id),false))->returnData;
                $last_journal = array_pop($journal);
                $workflow = (new workflow(array('form',$last_journal['WORKFLOW_ID']),false))->returnData[0];
                $groups_array = explode(',',$this->POSTvars['GROUPS']);
                $next_seq = intval($last_journal['SEQUENCE'])+1;

                //extract comments from JSON
                array_push($comments_array,$this->POSTvars['comment']);
                unset($this->POSTvars['comment']);

                // set PA/PF to A/F
                switch($last_journal['STATUS']) {
                    case "PA":
                        array_push($journal_array,"A");
                        break;
                    case "PF":
                        array_push($journal_array,"F");
                        break;
                    default:
                        // if last status is not PA or PF should not be approving
                        $this->raiseError(E_BAD_REQUEST);
                        return;
                }

                // Check for skip conditions
                $this->checkSkip($last_journal['WORKFLOW_ID'],0);
                if (!$this->match && $this->conditions) {
                    array_push($journal_array,"X");
                    array_push($comments_array,"Skipped by hierarchy rule");
                }

                // Check if approver is in next approval group and auto-approve
                if ($this->autoApproveNext($groups_array,$next_seq)) {
                    array_push($journal_array,'A');
                    array_push($comments_array,"Auto Approved - Approver in previous approval group");
                }
                
                // Set next status
                $end_seq = $next_seq + sizeof($journal_array) - 1;
                if ($end_seq >= sizeof($groups_array)) {
                    array_push($journal_array,"Z"); //TODO: should not happen; this should be "final"
                } else if ($end_seq == sizeof($groups_array)-1){
                    array_push($journal_array,"PF");
                } else {
                    array_push($journal_array,"PA");
                }

                // Update current journal entry from PA/PF to A/F
                $_SERVER['REQUEST_METHOD'] = 'PATCH';
                $jrnl_update = (new journal(array(
                    'form',
                    $form_id,
                    $last_journal['SEQUENCE'],
                    $last_journal['STATUS'],
                    $journal_array[0],
                    $comments_array[0]
                ),false))->returnData;

                // Post to Journal
                $_SERVER['REQUEST_METHOD'] = 'POST';
                $return_data = array("journal"=>[],"email_response"=>[]);
                foreach ($journal_array as $i=>$j) {
                    if ($i == 0) continue; //skip first elements
                    $seq = $next_seq+$i-1;
                    $data = array(
                        'form_id'=>$form_id,
                        'hierarchy_id'=>$last_journal['HIERARCHY_ID'],
                        'workflow_id'=>$last_journal['WORKFLOW_ID'],
                        'seq'=>$seq,
                        'groups'=>$this->POSTvars['GROUPS'],
                        'group_from'=>$groups_array[$seq-1],
                        'group_to'=>$groups_array[$seq],
                        'status'=>$j,
                        'submitted_by'=>$last_journal['CREATED_BY_SUNY_ID'],
                        'comment'=>$comments_array[$seq-1]
                    );
                    $return_data['journal'][] = $data;
                    $this->POSTvars['journal_data'] = $data;
                    $journal = (new journal(array('form',$form_id,$j,$data),false))->returnData;
                    
                    // Email Notification
                    $return_data['email_response'][$j] = $this->sendEmail($data);
                }

                $this->toJSON($return_data);
                break;

            case "reject":
                // check settings to see if "rejection" is enabled.
                $_SERVER['REQUEST_METHOD'] = 'GET';
                $settings = (new settings(array(),false))->returnData;
                if (!$settings['forms']['menu']['rejections']['enabled']) $this->raiseError(E_FORBIDDEN);

                $journal = (new journal(array('form',$this->POSTvars['formId']),false))->returnData;
                $last_journal = array_pop($journal);
                $groups_array = explode(',',$this->POSTvars['GROUPS']);
                
                $seq = intval($last_journal['SEQUENCE']);

                //extract comments from JSON
                $comment = $this->POSTvars['comment'];
                unset($this->POSTvars['comment']);

                // Update current journal entry to R
                $_SERVER['REQUEST_METHOD'] = 'PATCH';
                $jrnl_update = (new journal(array(
                    'form',
                    $this->POSTvars['formId'],
                    $seq,
                    $last_journal['STATUS'],
                    'R',
                    $comment
                ),false))->returnData;

                $return_data = array(
                    "journal"=>array(
                        'status'=>'R',
                        'form_id'=>$this->POSTvars['formId'],
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

            case "final":
                $_SERVER['REQUEST_METHOD'] = 'GET';
                $journal = (new journal(array('form',$this->POSTvars['formId']),false))->returnData;
                $last_journal = array_pop($journal);

                $groups_array = explode(',',$this->POSTvars['GROUPS']);

                $seq = intval($last_journal['SEQUENCE']);

                //extract comments from JSON
                $comment = $this->POSTvars['comment'];
                unset($this->POSTvars['comment']);
                
                // Update current to 'Z'
                $_SERVER['REQUEST_METHOD'] = 'PATCH';
                $jrnl_update = (new journal(array(
                    'form',
                    $this->POSTvars['formId'],
                    $seq,
                    $last_journal['STATUS'],
                    'Z',
                    $comment
                ),false))->returnData;
                
                // Move Request and Request_Journal to archive
                $_SERVER['REQUEST_METHOD'] = 'POST';
                $archive = (new archive(array('form',$this->POSTvars['formId']),false))->returnData;

                $return_data = array(
                    "journal"=>array(
                        'status'=>'Z',
                        'form_id'=>$this->POSTvars['formId'],
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
                $this->raiseError(E_BAD_REQUEST);
        };

        return;
    }

    function PUT() {
        // Format: /{action}/{form_id}
        // When draft: /save/draft/51645/123456789
        // When form: /save/48
        // When approval: /approve/48
        if ($this->req[1] == 'draft') {
            $qry = "update HRFORMS2_FORMS_DRAFTS set data = EMPTY_CLOB() 
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
            //TODO: do validation
            $qry = "update HRFORMS2_FORMS set form_data = EMPTY_CLOB() 
                where FORM_ID = :form_id
                returning FORM_DATA into :data";
            $stmt = oci_parse($this->db,$qry);
            $clob = oci_new_descriptor($this->db, OCI_D_LOB);
            oci_bind_by_name($stmt, ":form_id", $this->req[1]);
            oci_bind_by_name($stmt, ":data", $clob, -1, OCI_B_CLOB);
            $r = oci_execute($stmt,OCI_NO_AUTO_COMMIT);
            if (!$r) $this->raiseError();
            $clob->save(json_encode($this->POSTvars));
            oci_commit($this->db);
            //TODO: save comment?
            /*if ($this->POSTvars['action']=='approve'||$this->POSTvars['action']=='reject') {
                $_SERVER['REQUEST_METHOD'] = 'POST';
                $this->POST();
            }*/
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
