import React, { useState, lazy, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import { Container, Row, Col, Tabs, Tab } from "react-bootstrap";
import { useHotkeys } from "react-hotkeys-hook";
import { t } from "../../config/text";
import { NotFound, lazyRetry } from "../../app";
import { Helmet } from "react-helmet";

const PayrollTransactionsTab = lazy(()=>lazyRetry(()=>import("../../blocks/admin/transactions/paytrans")));
const CodesTab = lazy(()=>lazyRetry(()=>import("../../blocks/admin/transactions/codes")));
/** 
 * Using t.id instead of activeTab for the Router on this page to 
 * improve performance and pre-load data.
*/

export default function AdminFormTransactions() {
    const tabs = [
        {id:'paytrans',title:t('admin.transactions.tabs.paytrans')},
        {id:'payroll',title:t('admin.transactions.tabs.payroll')},
        {id:'form',title:t('admin.transactions.tabs.form')},
        {id:'action',title:t('admin.transactions.tabs.action')},
        {id:'transaction',title:t('admin.transactions.tabs.transaction')}
    ];
    const {subpage} = useParams();
    const history = useHistory();
    const [activeTab,setActiveTab] = useState('');
    const [tabTitle,setTabTitle] = useState('');

    const navigate = tab => {
        setActiveTab(tab);
        history.push('/admin/transactions/'+tab);
    }

    // ctrl+shift+left[right] are already built into tab navigation by the component
    useHotkeys('ctrl+right,ctrl+left',(_,handler)=>{
        const tabIds = tabs.map(t=>t.id);
        const idx = tabIds.indexOf(activeTab);
        let newIdx = (handler.key == 'ctrl+right')?idx+1:idx-1;
        if (newIdx < 0) newIdx = tabIds.length - 1;
        if (newIdx > tabIds.length - 1) newIdx = 0;
        navigate(tabIds.at(newIdx));
    },{enableOnTags:['INPUT']},[activeTab]);

    useEffect(()=>setActiveTab(tabs.map(t=>t.id).includes(subpage)?subpage:'paytrans'),[subpage]);
    useEffect(() => {
        if (!activeTab) setTabTitle('');
        setTabTitle(' - ' + tabs.find(t=>t.id==activeTab)?.title);
    },[activeTab])
    return (
        <>
            <section>
                <header>
                    <Helmet>
                        <title>{t('admin.transactions.title')}{tabTitle}</title>
                    </Helmet>
                    <Row>
                        <Col>
                            <h2>{t('admin.transactions.title')}</h2>
                        </Col>
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
