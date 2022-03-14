<?php
    set_include_path(implode(PATH_SEPARATOR, array(get_include_path(),'../')));
    include_once 'etc/config.php';
    include_once 'etc/CASconfig.php';
    include_once 'vendor/autoload.php';

    if (!CAS_HOST && INSTANCE == 'LOCAL') {
        //TOOD: need to do more?  This is all hard-coded and required DB direct updates
        $sid = 'DA30317F601904A3E0539406E280F00F';
        setcookie('session-id',$sid,$client_lifetime,$client_path,$client_domain,$client_secure,$client_httpOnly);
        return;
    }

    session_set_cookie_params($client_lifetime,$client_path,$client_domain,$client_secure,$client_httpOnly);
    phpCAS::client(CAS_VERSION_3_0, $cas_host, $cas_port, $cas_context);
    phpCAS::setCasServerCACert($cas_server_ca_cert_path);
    phpCAS::setNoCasServerValidation();//TODO: should this be off?
    phpCAS::handleLogoutRequests(true, $cas_real_hosts);
    phpCAS::forceAuthentication();

    if (phpCAS::isAuthenticated()) {
        $db = @oci_connect(DBUSER,DBPASS,DB,NLS_LANG);
        if (!$db) die('cannot connect to DB');
        $sessionData = array("SESSION_ID"=>$_COOKIE['session-id'],"CAS_SID"=>session_id(),"UDC_IDENTIFIER"=>phpCAS::getAttribute('UDC_IDENTIFIER'),"USER_ID"=>phpCAS::getUser(),"SUNY_ID"=>"");
        if (!$sessionData['UDC_IDENTIFIER']) die('no UDC IDENTIFIER');

        // Get SUNY_ID:
        $qry = "select suny_id from sunyhr.hr_id@banner.cc.binghamton.edu
        where regexp_substr(campus_local_id,'(B[0-9]{8})',1,1,'i',1) = :id";
        $stmt = oci_parse($db,$qry);
        oci_bind_by_name($stmt, ":id", $sessionData['UDC_IDENTIFIER']);
        oci_execute($stmt);
        $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
        if (!isset($row['SUNY_ID'])) die('no suny id');
        $sessionData['SUNY_ID'] = $row['SUNY_ID'];

        // Check for existing session
        if($sessionData['SESSION_ID']) {
            $qry = "select user_id from hrforms2_sessions
                where cas_session_id = :cas_sid and session_id = :sid
                and user_id = :user_id and suny_id = :suny_id";
            $stmt = oci_parse($db,$qry);
            oci_bind_by_name($stmt, ":cas_sid",$sessionData['CAS_SID']);
            oci_bind_by_name($stmt, ":sid",$sessionData['SESSION_ID']);
            oci_bind_by_name($stmt, ":user_id",$sessionData['USER_ID']);
            oci_bind_by_name($stmt, ":suny_id",$sessionData['SUNY_ID']);
            oci_execute($stmt);
            $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
            if ($row['USER_ID']) return;
        }
        // Create new session
        $qry = "select suny_id from sunyhr.hr_id@banner.cc.binghamton.edu
        where regexp_substr(campus_local_id,'(B[0-9]{8})',1,1,'i',1) = :id";
        $stmt = oci_parse($db,$qry);
        oci_bind_by_name($stmt, ":id", $sessionData['UDC_IDENTIFIER']);
        oci_execute($stmt);
        $row = oci_fetch_array($stmt,OCI_ASSOC+OCI_RETURN_NULLS);
        print_r($row);
        if (!isset($row['SUNY_ID'])) die('no suny id');
        $now = time();
        $qry = "insert into hrforms2_sessions values(SYS_GUID(),:cas_session_id,:user_id,:bnumber,:suny_id,:remote_ip,:login_date,:user_agent) returning session_id into :sid";
        $stmt = oci_parse($db,$qry);
        oci_bind_by_name($stmt,":cas_session_id",$sessionData['CAS_SID']);
        oci_bind_by_name($stmt,":user_id",$sessionData['USER_ID']);
        oci_bind_by_name($stmt,":bnumber",$sessionData['UDC_IDENTIFIER']);
        oci_bind_by_name($stmt,":suny_id",$row['SUNY_ID']);
        oci_bind_by_name($stmt,":remote_ip",$_SERVER['REMOTE_ADDR']);
        oci_bind_by_name($stmt,":login_date",$now);
        oci_bind_by_name($stmt,":user_agent",$_SERVER['HTTP_USER_AGENT']);
        oci_bind_by_name($stmt,":sid",$sid,32);
        oci_execute($stmt);
        setcookie('session-id',$sid,$client_lifetime,$client_path,$client_domain,$client_secure,$client_httpOnly);
    }
