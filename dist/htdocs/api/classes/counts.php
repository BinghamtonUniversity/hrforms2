<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Counts extends HRForms2 {
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
		// Validation...		
	}

	/* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
	function GET() {
		//TODO: create a view that counts and query that?
		$request_drafts = count((new requestlist(array('drafts'),false))->returnData);
		$request_pending = count((new requestlist(array('pending'),false))->returnData);
		$request_approvals = count((new requestlist(array('approvals'),false))->returnData);
		$request_rejections = count((new requestlist(array('rejections'),false))->returnData);
		$request_final = count((new requestlist(array('final'),false))->returnData);

		$form_drafts = count((new formlist(array('drafts'),false))->returnData);
		$form_pending = count((new formlist(array('pending'),false))->returnData);
		$form_approvals = count((new formlist(array('approvals'),false))->returnData);
		$form_rejections = count((new formlist(array('rejections'),false))->returnData);
		$form_final = count((new formlist(array('final'),false))->returnData);

		$counts = array(
            "requests" => array(
                "drafts"=>$request_drafts,
				"pending"=>$request_pending,
                "approvals"=>$request_approvals,
				"rejections"=>$request_rejections,
                "final"=>$request_final
            ),
            "forms" => array(
                "drafts"=>$form_drafts,
				"pending"=>$form_pending,
                "approvals"=>$form_approvals,
                "rejections"=>$form_rejections,
                "final"=>$form_final
            )
        );

		if ($this->sessionData['isAdmin']) {
			$counts['admin'] = array('requests'=>array(),'forms'=>array());

			foreach ($counts['admin'] as $key => $value) {
				$qry = "with ddiff as (select trunc(sysdate)-trunc(created_date) as date_diff from hrforms2_".$key."),
					dd as (select 
						case
							when date_diff <= 1 then '1'
							when date_diff > 1 and date_diff <= 7 then '7'
							when date_diff > 7 and date_diff <= 14 then '14'
							when date_diff > 14 and date_diff <= 28 then '28'
							else '9999'
						end as cat from ddiff where date_diff < 30)
					select cat, count(*) as cnt from dd
					group by cat
					order by cat";
				$stmt = oci_parse($this->db,$qry);
				$r = oci_execute($stmt);
				if (!$r) $this->raiseError();
				while ($row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS)) {
					$counts['admin'][$key][$row['CAT']] = $row['CNT'];
				}
				oci_free_statement($stmt);
			}
		}

        $this->toJSON($counts);
	}
}
