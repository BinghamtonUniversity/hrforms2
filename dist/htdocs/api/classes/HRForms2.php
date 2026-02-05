<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
require '../../vendor/autoload.php';

set_include_path(implode(PATH_SEPARATOR, array(get_include_path(),'../../','./api/classes/')));
include_once 'etc/config.php';

/* define error codes */
define("E_NO_DATA",204);
define("E_BAD_REQUEST",400);
define("E_NOT_AUTHORIZED",401);
define("E_NO_SESSION",481);
define("E_FORBIDDEN",403);
define("E_METHOD_NOT_ALLOWED",405);
define("E_NOT_FOUND",404);
define("E_TOO_MANY_DRAFTS",429);
define("E_TEST",999);

Class HRForms2 {
    protected $db;
    protected $method;
    protected $POSTvars;
    protected $reqAuth = true;
    protected $allowedMethods = "";	protected $hasError = false;

    protected $sessionData = array('VERSION'=>VERSION,'REVISION'=>REVISION,'INSTANCE'=>INSTANCE,'HOST'=>HOST,'DEBUG'=>DEBUG);
    //protected $userData = array();
    public $returnData;

    protected function traverse($data,&$result,$prefix="") {
        if (is_object($data)) {
            $data = get_object_vars($data);
        }
        if (is_array($data)) {
            foreach ($data as $key => $value) {
                $fkey = strtoupper(($prefix!="") ? $prefix.":".$key : $key);
                if (is_array($value) || is_object($value)) {
                    $this->traverse($value,$result,$fkey);
                } else {
                    $result[strtoupper($fkey)] = $value;
                }
            }
        }
    }

    function init(array $args = array()) {
        $this->AppPath = $_SERVER['DOCUMENT_ROOT'];
        // Set Allow response header indicating what methods are allowed.
        header('Allow:'.$this->allowedMethods);
        $this->method = $_SERVER['REQUEST_METHOD'];
        $this->POSTvars = file_get_contents("php://input");
        //Remove unicode characters from POST data
        $this->POSTvars = mb_convert_encoding($this->POSTvars, 'ASCII', mb_detect_encoding($this->POSTvars));
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
            $errMsg = "The requested operation returned no content.";
            break;
        case E_BAD_REQUEST:
            $errStatus = 400;
            $errTitle = "Bad Request";
            $errMsg = "Invalid or missing parameters in request.";
            break;
        case E_NOT_AUTHORIZED:
            $errStatus = 401;
            $errTitle = "Not Authorized";
            $errMsg = "Not authorized for requested operation.";
            break;
        case E_FORBIDDEN:
            $errStatus = 403;
            $errTitle = "Not Allowed";
            $errMsg = "The requested operation is not allowed.";
            break;
        case E_NOT_FOUND:
            $errStatus = 404;
            $errTitle = "Not Found";
            $errMsg = "No operation matching the request found.";
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
        include_once 'etc/CASconfig.php';
        include_once 'vendor/autoload.php';
        #var_dump(PHP_VERSION_ID);

        if (!CAS_HOST && INSTANCE == 'LOCAL') {
            $UDC_IDENTIFIER = json_decode($_COOKIE['hrforms2_local'])->bnumber;
            $this->sessionData = array_merge($this->sessionData,array("SESSION_ID"=>$_COOKIE['session-id'],"CAS_SID"=>"local","UDC_IDENTIFIER"=>$UDC_IDENTIFIER));
        } else {
            if (!phpCAS::isInitialized()) {
                session_set_cookie_params($client_lifetime,$client_path,$client_domain,$client_secure,$client_httpOnly);
                #phpCAS::client(CAS_VERSION_3_0, $cas_host, $cas_port, $cas_context);
                phpCAS::client(CAS_VERSION_2_0, $cas_host, $cas_port, $cas_context, $client_service_name);
                #phpCAS::setCasServerCACert($cas_server_ca_cert_path);
                phpCAS::setNoCasServerValidation();//TODO: should this be off?
                phpCAS::handleLogoutRequests(true, $cas_real_hosts);
                phpCAS::forceAuthentication();
            }
            $this->sessionData = array_merge($this->sessionData,array("SESSION_ID"=>$_COOKIE['session-id'],"CAS_SID"=>session_id(),"UDC_IDENTIFIER"=>phpCAS::getAttribute('UDC_IDENTIFIER')));
        }
        if (!isset($this->sessionData['CAS_SID'])) $this->raiseError(E_NOT_AUTHORIZED,array("errMsg"=>"No valid session found."));
        $this->sessionInfo();
        return true;
    }

    protected function sessionInfo() {
        if (isset($this->sessionData['SUNY_ID'])) return $this->sessionData;
        $qry = "select s.suny_id, s.user_id, s.bnumber, s.ip_address, sp.spriden_pidm, em.email,
            ovr.suny_id as ovr_suny_id, nvl(ovr.suny_id,s.suny_id) as effective_suny_id
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
        if (!$row) $this->raiseError(E_NOT_AUTHORIZED,array("errMsg"=>"Invalid session."));
        $this->sessionData = (!$row)?array():array_merge($this->sessionData,$row);
        $this->isAdmin($this->sessionData['SUNY_ID']);
        $this->isViewer($this->sessionData['EFFECTIVE_SUNY_ID']);
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

    /*protected function toCSV($filename,$headers,$data) {
        header('X-App-Version:'.VERSION);
        header('X-App-Revision:'.REVISION);

        header("Content-type: application/csv");
        header("Content-Disposition: attachment; filename=$filename");
        header("Pragma: no-cache");
        header("Expires: 0");

        $output = fopen("php://output",'w') or die("Can't open php://output");
        fputcsv($output, $headers);
        foreach($data as $row) {
            fputcsv($output, $row);
        }
        fclose($output) or die("Can't close php://output");
    }*/

    protected function done() {
        $this->toJSON(array("success" => true));
    }

    /* CUSTOM APPLICATION FUNCTIONS */	

    /**
    * Helper function to convert null values in an array to empty strings
    * @param array $array - array containing null values to conver to empty strings
    * @return array - return updated array
    */
    protected function null2Empty($array) {
        foreach($array as &$row) {
            if (is_array($row)) {
                $row = $this->null2Empty($row);
            } else {
                $row = (is_null($row))?"":$row;
            }
        }
        return $array;
    }
    
    protected function nullToEmpty(&$array) {
        foreach($array as &$row) {
            if (is_array($row)) {
                foreach($row as $key=>$value) {
                    if (is_null($value)) $row[$key] = "";
                }
            } else {
                var_dump($row);
            }
        }
    }

    /**
    * Returns true/false if the SUNY ID is in the local admin table
    * @param number $id - SUNY ID to check
    * @return boolean
    */
    protected function isAdmin($id) {
        if (isset($this->sessionData['isAdmin'])) return $this->sessionData['isAdmin'];
        $qry = "select count(suny_id) as IS_ADMIN from hrforms2_user_groups where group_id = -1 and suny_id = :sunyid";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt, ":sunyid", $id);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
        $this->sessionData['isAdmin'] = ($row&&isset($row['IS_ADMIN'])) ? $row['IS_ADMIN'] : 0;
        return $this->sessionData['isAdmin'];
    }

    /**
    * Returns true/false if the SUNY ID is in the local admin table
    * @param number $id - SUNY ID to check
    * @return boolean
    */
    protected function isViewer($id) {
        if (isset($this->sessionData['isViewer'])) return $this->sessionData['isViewer'];
        $qry = "select decode(u.user_options.viewer,'Y',1,0) as IS_VIEWER from hrforms2_users u where suny_id = :sunyid";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt, ":sunyid", $id);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
        $this->sessionData['isViewer'] = ($row&&isset($row['IS_VIEWER'])) ? $row['IS_VIEWER'] : 0;
        return $this->sessionData['isViewer'];
    }

    /**
     * Returns GroupID for Department Code given
     * @param number $deptcode - Department Code to lookup 
     * @return array
     */
    protected function getGroupIds($deptcode) {
        if (!isset($deptcode)) $this->raiseError(E_BAD_REQUEST,array("errMsg"=>"Department Code is required"));
        $qry = "select group_id from hrforms2_group_departments where department_code = :dept_code";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt, ":dept_code", $deptcode);
        oci_execute($stmt);
        $group_id = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
        oci_free_statement($stmt);
        return $group_id;
    }

    /**
     * Returns an array of email addresses from the users table
     * @param string|array $ids - a single SUNY_ID or array of SUNY_IDs
     * @return array
     */
    protected function getUserEmail($ids) {
        if (is_string($ids)) $ids = [$ids];
        if (!is_array($ids)) return [];

        $arr = array();
        foreach($ids as $id) {
            $user = (new user(array($id),false))->returnData[0];
            if ($user['EMAIL_ADDRESS_WORK'] == "") continue;
            array_push($arr,$user['EMAIL_ADDRESS_WORK']);
        }
        return $arr;
    }

    /**
     * Returns an array of email addresses for users from a group
     * @param string|int $id - a GROUP_ID
     * @return array
     */
    protected function getGroupEmails($id) {
        $emails = array();
        $groupusers = (new groupusers(array($id),false))->returnData;
        foreach ($groupusers as $user) {
            if ($user['NOTIFICATIONS'] == 'Y') {
                if (isset($user['EMAIL_ADDRESS_WORK'])&&$user['EMAIL_ADDRESS_WORK']!="") array_push($emails,$user['EMAIL_ADDRESS_WORK']);
            }
        }
        return $emails;
    }

    function sendError($message,$subject="HRForms2 Error",$type) {
        $origMethod = $_SERVER['REQUEST_METHOD'];
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $settings = (new settings(array(),false))->returnData;
        if (!$settings[$type]['email']['enabled']) return;
        $email_settings = (array)$settings[$type]['email'];

        $vars = array(
            'ERROR'=> false,
            'PROD' => (INSTANCE=='PROD'),
            'INSTANCE' => INSTANCE,
            'DEBUG' => DEBUG,
            'SMTP_DEBUG' => SMTP_DEBUG,
        );

        $email_list = array(
            "mailto"=>$this->getGroupEmails($email_settings['errorsGroup']),
            "mailcc"=>array()
        );
        $replyto = $email_settings['from'];

        // get templates
        $partials = [];
        $email_template = "error";
        $templates = (new template(array(),false))->returnData;
        foreach ($templates as $template) {
            if ($template['TEMPLATE_TYPE'] == 'S') $partials[$template['TEMPLATE_SLUG']] = "";
            
        }
        foreach ($partials as $key=>$val) {
            $rv = (new template(array($key),false))->returnData;
            $partials[$key] = $rv['TEMPLATE'];
        }
        $tmpl = (new template(array($email_template),false))->returnData;

        //build variables array
        $vars = array_merge($vars,array(
            'SUBJECT' => $subject,
            'MAILTO' => function() use ($email_list) { return implode(', ',$email_list['mailto']); },
            'MAILCC' => function() use ($email_list) { return implode(', ',$email_list['mailcc']); },
            'REPLYTO' => $replyto,
            'ERROR_MESSAGE' => $message
        ));
        $vars = array_merge($vars,$this->sessionData);
        $m = new Mustache_Engine(array(
            'partials' => $partials
        ));
        $content = str_replace('{{&gt;','{{>',$tmpl['TEMPLATE']); // fix partial HTML entities 
        // append notProduction and debugInformation partials to the beginning of the $content
        $content = "{{>notProduction}}<br>" . $content . "<br><br><hr>{{>errorDebugInformation}}";
        
        // start PHP mailer
        ob_start();
        
        $mail = new PHPMailer();
        $mail->isSMTP();
        if (SMTP_DEBUG) {
            $mail->SMTPDebug = SMTP::DEBUG_SERVER;
        } else {
            $mail->SMTPDebug = SMTP::DEBUG_OFF;
        }
        $mail->Host = SMTP_HOST;
        $mail->Port = SMTP_PORT;
        $mail->SMTPAuth = SMTP_AUTH;
        $mail->Username = SMTP_USERNAME;
        $mail->Password = SMTP_PASSWORD;

        $mail->setFrom($email_settings['from']);
        if (INSTANCE == 'PROD') {
            foreach($email_list['mailto'] as $email) {
                $mail->addAddress($email);
            }
            foreach($email_list['mailcc'] as $email) {
                $mail->addCC($email);
            }
        } else {
            $emailTo = empty($this->sessionData['EMAIL'])?$this->getGroupEmails($email_settings['errorsGroup']):$this->sessionData['EMAIL'];
            $mail->addAddress($emailTo);
        }
        if (!!$replyto) $mail->addReplyTo($replyto);
        
        $mail->Subject = $subject;
        $htmlBody = $m->render($content,$vars);
        $mail->msgHTML($htmlBody);
        $mail->send();
    
        $output = ob_get_contents();
        ob_end_clean();

        $_SERVER['REQUEST_METHOD'] = $origMethod;
        return $output;
    }

    /**
     * Triggers sending the email notification
     * @param array{
     * 		requestId|formId: int,
     * 		hierarchy_id: int,
     * 		workflow_id: int,
     * 		seq: int,
     * 		groups: string,
     * 		group_from: int,
     * 		group_to: int,
     * 		status: string,
     * 		submitted_by: int,
     * 		comment: string
     * } $journal - Journal record from Request or Form
     * @return mixed - Returns output from debug if enabled; could be null/undefined.
     */
    function sendEmail($journal) {
        $origMethod = $_SERVER['REQUEST_METHOD'];
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $settings = (new settings(array(),false))->returnData;

        $type = null;
        //build variables array
        $vars = array(
            'ERROR'=> false,
            'PROD' => (INSTANCE=='PROD'),
            'INSTANCE' => INSTANCE,
            'DEBUG' => DEBUG,
            'SMTP_DEBUG' => SMTP_DEBUG,
            'URL' => ''
        );
        if (array_key_exists('request_id',$journal)) {
            $id = $journal['request_id'];
            $type = 'requests';
            $template_type = 'R';
            $vars['URL'] = 'https://'.HOST.'/#/request/'.$id;
            $requestData = (new requests(array($id),false))->returnData;
            $flat = array();
            $this->traverse($requestData,$flat,"REQ");
            $vars = array_merge($vars,$flat);
        }
        if (array_key_exists('form_id',$journal)) {
            $id = $journal['form_id'];
            $type = 'forms';
            $template_type = 'F';
            $vars['URL'] = 'https://'.HOST.'/#/form/'.$id;
            $formData = (new forms(array($id),false))->returnData;
            $flat = array();
            $this->traverse($formData,$flat,"FORM");
            $vars = array_merge($vars,$flat);
        }
        if ($type == null) {
            $_SERVER['REQUEST_METHOD'] = $origMethod;
            return "Invalid Type";
        }
        $vars = array_merge($vars,array_change_key_case($journal,CASE_UPPER));

        $status = $journal['status'];
        $email_settings = (array)$settings[$type]['email'];
        $options = $email_settings['status'][$status];
        /*
        $defaultEmail = $settings[$type]['email']['default']; //not valid; group now
        */
        $defaultEmail = "geigers+hrforms2-".strtolower(INSTANCE)."-default@binghamton.edu";
        $errorEmail = $this->getGroupEmails($email_settings['errorsGroup']);

        // Check for no "To" options and return
        if (count(array_filter($options['mailto'],'strlen')) == 0) {
            $_SERVER['REQUEST_METHOD'] = $origMethod;
            return "No email notification for this status";
        }
        // Get Submitter Info
        $submitter = (new user(array($journal['submitted_by']),false))->returnData[0];
        $vars['SUBMITTER_NAME'] = (empty($submitter['ALIAS_FIRST_NAME'])?$submitter['LEGAL_FIRST_NAME']:$submitter['ALIAS_FIRST_NAME']).' '.$submitter['LEGAL_LAST_NAME'];
        $vars['SUBMITTER_EMAIL'] = $submitter['EMAIL_ADDRESS_WORK'];

        // Get Groups Info
        $groups = (new groups(array(),false))->returnData;
        $group_to_id = array_search($journal['group_to'],array_column($groups,'GROUP_ID'));
        $vars['GROUP_TO_NAME'] = $groups[$group_to_id]['GROUP_NAME'];
        $vars['GROUP_TO_DESCRIPTION'] = $groups[$group_to_id]['GROUP_DESCRIPTION'];
        $group_from_id = array_search($journal['group_to'],array_column($groups,'GROUP_ID'));
        $vars['GROUP_FROM_NAME'] = $groups[$group_from_id]['GROUP_NAME'];
        $vars['GROUP_FROM_DESCRIPTION'] = $groups[$group_from_id]['GROUP_DESCRIPTION'];
        
        // Collect Email Addresses
        $email_list = array('mailto'=>[],'mailcc'=>[]);
        foreach (array_keys($email_list) as $key) {
            foreach ($options[$key] as $opt=>$b) {
                if (!$b) continue;
                switch($b) {
                    case "submitter":
                        $email_list[$key] = array_merge($email_list[$key],$this->getUserEmail($journal['submitted_by']));
                        break;
                    case "group_to":
                        if ($journal['group_to'] != "") {
                            $group_to_users = (new groupusers(array($journal['group_to']),false))->returnData;
                            foreach ($group_to_users as $user) {
                                if ($user['EMAIL_ADDRESS_WORK'] != "" && $user['EMAIL_ADDRESS_WORK'] != null && $user['NOTIFICATIONS'] == 'Y') 
                                    $email_list[$key] = array_merge($email_list[$key],array($user['EMAIL_ADDRESS_WORK']));
                            }
                        }
                        break;
                    case "group_from":
                        if ($journal['group_from'] != "") {
                            $group_from_users = (new groupusers(array($journal['group_from']),false))->returnData;
                            foreach ($group_from_users as $user) {
                                if ($user['EMAIL_ADDRESS_WORK'] != "" && $user['EMAIL_ADDRESS_WORK'] != null && $user['NOTIFICATIONS'] == 'Y')
                                    $email_list[$key] = array_merge($email_list[$key],array($user['EMAIL_ADDRESS_WORK']));
                            }
                        }
                        break;
                    case "default":
                        array_push($email_list[$key],$defaultEmail);
                        break;
                    case "error":
                        array_push($email_list[$key],$errorEmail);
                }
            }
        }
        // Set Mail-To to "error" email if empty
        if (sizeof($email_list['mailto']) == 0) {
            $vars['ERROR'] = '<span style="color:#900"><strong>ERROR:</strong> No MAILTO email address specified.  There may not be any users in the group or all users have notifications disabled.</span><br>';
            array_push($email_list['mailto'],$errorEmail);
        }

        // Set Reply-To Email Address
        $replyto = "";
        switch($options['replyto']) {
            case "submitter":
                $replyto = $this->getUserEmail($journal['submitted_by'])[0];
                break;
            case "default":
                $replyto = $defaultEmail; 
                break;
            case "error":
                $replyto = $errorEmail;
                break;
        }

        // set subject
        $subject = '[HRFORMS2-'.INSTANCE.']: '.($vars['ERROR']?'**ERROR** ':'').$email_settings['subject'].' - '.$options['subject'];

        // get templates
        $partials = [];
        $email_template = "";
        $templates = (new template(array(),false))->returnData;
        foreach ($templates as $template) {
            if ($template['TEMPLATE_TYPE'] == 'S') $partials[$template['TEMPLATE_SLUG']] = "";
            if ($template['TEMPLATE_TYPE'] == $template_type && $template['TEMPLATE_STATUS_CODE'] == $status) $email_template = $template['TEMPLATE_SLUG'];
        }
        foreach ($partials as $key=>$val) {
            $rv = (new template(array($key),false))->returnData;
            $partials[$key] = $rv['TEMPLATE'];
        }
        $tmpl = (new template(array($email_template),false))->returnData;

        //build variables array
        $vars = array_merge($vars,array(
            'SUBJECT' => $subject,
            'MAILTO' => function() use ($email_list) { return implode(', ',$email_list['mailto']); },
            'MAILCC' => function() use ($email_list) { return implode(', ',$email_list['mailcc']); },
            'REPLYTO' => $replyto
        ));

        // add helper functions
        $vars = array_merge($vars,array(
            'formatCurrency' => function($text, Mustache_LambdaHelper $helper) {
                $value = $helper->render($text);
                return '$'.number_format($value,2);
            },
            'formatDate' => function($text, Mustache_LambdaHelper $helper) {
                $value = $helper->render($text);
                return date("m/d/Y",strtotime($value));
            }
        ));

        $m = new Mustache_Engine(array(
            'partials' => $partials
        ));
        $content = str_replace('{{&gt;','{{>',$tmpl['TEMPLATE']); // fix partial HTML entities 
        // append notProduction and debugInformation partials to the beginning of the $content
        $content = "{{#ERROR}}{{{ERROR}}}{{/ERROR}}{{>notProduction}}<br>" . $content . "<br><br><hr>{{>debugInformation}}";

        // start PHP mailer
        ob_start();
        if ($email_settings['enabled']) {
            $mail = new PHPMailer();
            $mail->isSMTP();
            if (SMTP_DEBUG) {
                $mail->SMTPDebug = SMTP::DEBUG_SERVER;
            } else {
                $mail->SMTPDebug = SMTP::DEBUG_OFF;
            }
            $mail->Host = SMTP_HOST;
            $mail->Port = SMTP_PORT;
            $mail->SMTPAuth = SMTP_AUTH;
            $mail->Username = SMTP_USERNAME;
            $mail->Password = SMTP_PASSWORD;

            $mail->setFrom($email_settings['from'],$email_settings['name']);
            if (INSTANCE == 'PROD') {
                foreach($email_list['mailto'] as $email) {
                    $mail->addAddress($email);
                }
                foreach($email_list['mailcc'] as $email) {
                    $mail->addCC($email);
                }
            } else {
                $emailTo = empty($this->sessionData['EMAIL'])?$errorEmail:$this->sessionData['EMAIL'];
                $mail->addAddress($emailTo);
            }
            if ($replyto!="") $mail->addReplyTo($replyto);
            
            $mail->Subject = $subject;
            $htmlBody = $m->render($content,$vars);
            $mail->msgHTML($htmlBody);
            $mail->send();
        }
        $output = ob_get_contents();
        ob_end_clean();

        $_SERVER['REQUEST_METHOD'] = $origMethod;
        return $output;
    }
}
