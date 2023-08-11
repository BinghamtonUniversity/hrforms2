import React, { useState, lazy, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import { Container, Row, Col, Tabs, Tab } from "react-bootstrap";
import { useHotkeys } from "react-hotkeys-hook";
import { t } from "../../config/text";
import { NotFound } from "../../app";

const PayrollTransactionsTab = lazy(()=>import("../../blocks/admin/transactions/paytrans"));
const CodesTab = lazy(()=>import("../../blocks/admin/transactions/codes"));

/** 
 * Using t.id instead of activeTab for the Router on this page to 
 * improve performance and pre-load data.
*/

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

    useHotkeys('ctrl+right,ctrl+left',(_,handler)=>{
        const tabIds = tabs.map(t=>t.id);
        const idx = tabIds.indexOf(activeTab);
        let newIdx = (handler.key == 'ctrl+right')?idx+1:idx-1;
        if (newIdx < 0) newIdx = tabIds.length - 1;
        if (newIdx > tabIds.length - 1) newIdx = 0;
        navigate(tabIds.at(newIdx));
    },{enableOnTags:['INPUT']},[activeTab]);

    useEffect(()=>setActiveTab(tabs.map(t=>t.id).includes(subpage)?subpage:'paytrans'),[subpage]);
    return (
        <>
            <section>
                <header>
                    <Row>
                        <Col><h2>{t('admin.transactions.title')}</h2></Col>
                    </Row>
                </header>
                <Tabs activeKey={activeTab} onSelect={navigate} id="form-transaciton-tabs">
                    {tabs.map(t => (
                        <Tab key={t.id} eventKey={t.id} title={t.title}>
                            <Container as="article" className="mt-3" fluid>
                                <FormTransactionRouter tab={t.id} tabName={t.title}/>
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
        default: return <NotFound/>;
    }
});
