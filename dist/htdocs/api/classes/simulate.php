<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Simulate extends HRForms2 {
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
        if (!$this->sessionData['isAdmin']) $this->raiseError(E_FORBIDDEN,array("errMsg"=>"You do not have permission to access this function"));
        if (!in_array($this->req[0], ['request','form'])) $this->raiseError(E_BAD_REQUEST);
        if (!isset($this->req[1]) || !is_numeric($this->req[1])) $this->raiseError(E_BAD_REQUEST);
    }

    /* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
    function GET() {
        $this->done();
    }

    function POST() {
        # we are using post to pass a request body with the settings
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $email_settings = $this->POSTvars['settings'];
        $workflow = (new workflow(array($this->req[0],$this->req[1]),false))->returnData[0];
        $groups = explode(',',$workflow['GROUPS']);
        if ($groups[0] != '-99') array_unshift($groups,'-99'); // add submitter group if not already there

        $statusArray = array();
        foreach ($groups as $i=>$group) {
            if ($i == 0) array_push($statusArray,array('S'=>array("groups"=>array($groups[$i],$groups[$i+1]))));
            if ($i > 0 && $i < count($groups)-1) {
                array_push($statusArray,array('PA'=>array("groups"=>array($groups[$i],$groups[$i+1]))));
                array_push($statusArray,array('A'=>array("groups"=>array($groups[$i],$groups[$i+1]))));
            }
            if ($i == count($groups)-1) {
                array_push($statusArray,array('PF'=>array("groups"=>array($groups[$i],''))));
                array_push($statusArray,array('Z'=>array("groups"=>array($groups[$i],''))));
            }
        }
        foreach ($groups as $i=>$group) {
            if ($i < count($groups)-1) {
                array_push($statusArray,array('R'=>array("groups"=>array($groups[$i+1],$groups[0]))));
            }
        }
        foreach ($groups as $i=>$group) {
            if ($i < count($groups)-1) {
                array_push($statusArray,array('X'=>array("groups"=>array($groups[$i],$groups[$i+1]))));
            }
        }

        foreach ($statusArray as $i=>$status) {
            foreach ($status as $statusCode=>$statusData) {
                $data = array(
                    'form_id'=>null,
                    'hierarchy_id'=>null,
                    'workflow_id'=>$workflow['WORKFLOW_ID'],
                    'seq'=>0,
                    'groups'=>$workflow['GROUPS'],
                    'group_from'=>$statusData['groups'][0],
                    'group_to'=>$statusData['groups'][1],
                    'status'=>$statusCode,
                    'submitted_by'=>$this->sessionData['SUNY_ID'],
                    'comment'=>''
                );
                $simulate = $this->collectEmails(
                    $data['submitted_by'],
                    $data['group_from'],
                    $data['group_to'],
                    $data['status'],
                    $email_settings['status'][$statusCode]
                );
                $statusArray[$i][$statusCode]['email'] = $simulate;
            }
        }

        $_SERVER['REQUEST_METHOD'] = 'POST';
        $this->toJSON($statusArray);
    }
}
