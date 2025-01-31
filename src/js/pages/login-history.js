import React from "react";
import { Row, Col, Alert } from "react-bootstrap";
import useSessionQueries from "../queries/session";
import DataTable from "react-data-table-component";
import { fromUnixTime, format, formatDistance } from "date-fns";

export default function LoginHistory() {
    const { getLoginHistory } = useSessionQueries();
    const loginhistory = getLoginHistory();

    const columns = [
        {id:'login_date',name:'Login Date',selector:row=>row.LOGIN_DATE,sortable:true,format:row => {
            const d = fromUnixTime(row.LOGIN_DATE);
            const fmt = format(d,'Pp');
            const dist = formatDistance(d,new Date(),{addSuffix:true});
            return `${fmt} (${dist})`;
        }},
        {id:'ip_address',name:'IP Address',selector:row=>row.IP_ADDRESS,sortable:true},
        {id:'user_agent',name:'User Agent',selector:row=>row.USER_AGENT,sortable:false,grow:2}
    ];

    return (
        <section>
            <header>
                <Row>
                    <Col as="h2">Login History</Col>
                </Row>
            </header>
            <article>
                <DataTable
                    defaultSortFieldId="login_date"
                    defaultSortAsc={false}
                    className="compact"
                    columns={columns} 
                    data={loginhistory.data}
                    progressPending={loginhistory.isLoading}
                    pagination 
                    striped 
                    responsive
                    highlightOnHover
                />
            </article>
        </section>
    );
}