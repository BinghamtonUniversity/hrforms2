<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Export extends HRForms2 {
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
		if ($this->method == 'GET' && count($this->req) != 2) $this->raiseError(E_BAD_REQUEST);
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
        // Collect the data
        $headers = array();
        $data = array();
        $filename = "";
		switch($this->req[0]) {
            case "user":
                $filename = "HRForms2_Users";
                $users = (new user(array(),false))->returnData;
                $headers = array_keys($users[0]);
                foreach($users as $k=>$user) array_push($data,array_values($user));
                break;
            default:
                $this->raiseError(E_BAD_REQUEST);
        }

        // Set format and send request
        switch($this->req[1]) {
            case "csv":
                $filename .= ".csv";
                $this->toCSV($filename,$headers,$data);
                break;
            default:
                $this->raiseError(E_BAD_REQUEST);
        }
	}

    function POST() {
        switch($this->req[0]) {
            case "csv":
                $this->toCSV($this->POSTvars['filename'],$this->POSTvars['headers'],$this->POSTvars['data']);
                break;
            default:
                $this->raiseError(E_BAD_REQUEST);
        }
    }
}
