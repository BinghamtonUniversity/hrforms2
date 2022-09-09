import React, { useState, lazy, useEffect, useMemo } from "react";
import { useParams, useHistory } from "react-router-dom";
import { Container, Row, Col, Tabs, Tab, Badge } from "react-bootstrap";
import { Loading, AppButton } from "../../blocks/components";

const PayrollTransactionsTab = lazy(()=>import("../../blocks/admin/transactions/paytrans"));
const CodesTab = lazy(()=>import("../../blocks/admin/transactions/codes"));

export default function AdminFormTransactions() {
    const tabs = [
        {id:'paytrans',title:'Payroll Transactions'},
        {id:'payroll',title:'Payroll Codes'},
        {id:'form',title:'Form Codes'},
        {id:'action',title:'Action Codes'},
        {id:'transaction',title:'Transaction Codes'}
    ];
    const {subpage} = useParams();
    const history = useHistory();
    const [activeTab,setActiveTab] = useState('');

    const navigate = tab => {
        setActiveTab(tab);
        history.push('/admin/transactions/'+tab);
    }

    useEffect(()=>setActiveTab(tabs.map(t=>t.id).includes(subpage)?subpage:'paytrans'),[subpage]);
    return (
        <>
            <section>
                <header>
                    <Row>
                        <Col><h2>Form Transactions</h2></Col>
                    </Row>
                </header>
                <Tabs activeKey={activeTab} onSelect={navigate} id="form-transaciton-tabs">
                    {tabs.map(t => (
                        <Tab key={t.id} eventKey={t.id} title={t.title}>
                            <Container as="article" className="mt-3" fluid>
                                <FormTransactionRouter tab={activeTab} tabName={t.title}/>
                            </Container>
                        </Tab>
                    ))}
                </Tabs>
            </section>
        </>
    );
}

const FormTransactionRouter = React.memo(({tab,...rest}) => {
    switch(tab) {
        case "paytrans":return <PayrollTransactionsTab/>;
        case "payroll": 
        case "form":
        case "action":
        case "transaction": return <CodesTab tab={tab} {...rest}/>;
        default: return <p>not found</p>;
    }
});
