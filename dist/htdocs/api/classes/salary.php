<?php
/*
NB: set $this->reqAuth = false in __construct to allow calls to functions without authentication checks.  Call $this->checkAuth() from functions to selectively restrict access.

NB: HTTP Codes: https://tools.ietf.org/html/rfc7231#section-6
405: Method Not Allowed
501: Not Implemented

NB: HTTP Request Methods: https://tools.ietf.org/html/rfc7231#section-4.3
*/

class Salary extends HRForms2 {
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
        if ($this->method == "GET" && !isset($this->req[0])) $this->raiseError(400);
    }

/***** DROP AND MOVE TO EMPLOYMENTINFO */

    /* create functions GET,POST,PUT,PATCH,DELETE as needed - defaults provided from init reflection method */
    function GET() {
        // Get PAY_BASIS first
        $qry = "SELECT pay_basis from buhr.buhr_persemp_mv@banner.cc.binghamton.edu where suny_id = :sunyid";
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":sunyid", $this->req[0]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
        if ($row['PAY_BASIS'] == '') $this->raiseError(204,array("errMsg"=>"No Pay Basis Found for SUNY ID: ".$this->req[0]));
        if ($row['PAY_BASIS'] == 'FEE') {
            $qry = "SELECT commitment_effective_date as EFFECTIVE_DATE, commitment_rate as RATE_AMOUNT, number_of_payments 
                    FROM buhr.buhr_commitment_mv@banner.cc.binghamton.edu
                    WHERE data_status <> 'H'
                    AND suny_id = :sunyid
                    AND commitment_effective_date <= nvl(:effdate,sysdate)
                    ORDER BY commitment_effective_date desc";
        } else {
            $qry = "SELECT salary_effective_date as EFFECTIVE_DATE, fta_rate as RATE_AMOUNT, null as NUMBER_OF_PAYMENTS
                    FROM buhr.buhr_salary_mv@banner.cc.binghamton.edu
                    WHERE data_status <> 'H'
                    AND suny_id = :sunyid
                    AND salary_effective_date <= nvl(:effdate,sysdate)
                    ORDER BY salary_effective_date desc";
        }
        $stmt = oci_parse($this->db,$qry);
        oci_bind_by_name($stmt,":sunyid", $this->req[0]);
        oci_bind_by_name($stmt,":effdate", $this->req[1]);
        $r = oci_execute($stmt);
        if (!$r) $this->raiseError();
        oci_fetch_all($stmt,$this->_arr,null,null,OCI_FETCHSTATEMENT_BY_ROW);
        $this->returnData = $this->_arr;
        if ($this->retJSON) $this->toJSON($this->returnData);
    }
}
