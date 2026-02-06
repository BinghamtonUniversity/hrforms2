import React, { useState, lazy, useEffect } from "react";
import { useQueryClient } from "react-query";
import { Row, Col, Form, Tabs, Tab, Container, Alert } from "react-bootstrap";
import { useForm, FormProvider } from "react-hook-form";
import { AppButton, Loading, errorToast } from "../../blocks/components";
import { toast } from "react-toastify";
import { t } from "../../config/text";
import { NotFound, lazyRetry } from "../../app";
import useSettingsQueries from "../../queries/settings";
import { useHistory, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { tabs, defaultVals } from "../../config/settings";

/* N.B. Must use t.id instead of activeTab or radio options will not work */

const SettingsRequests = lazy(()=>lazyRetry(()=>import("../../blocks/admin/settings/requests")));
const SettingsForms = lazy(()=>lazyRetry(()=>import("../../blocks/admin/settings/forms")));
const SettingsGeneral = lazy(()=>lazyRetry(()=>import("../../blocks/admin/settings/general")));
const SettingsWorkflow = lazy(()=>lazyRetry(()=>import("../../blocks/admin/settings/workflow")));

export default function AdminSettings() {
    const { getSettings } = useSettingsQueries();
    const settings = getSettings();
    if (settings.isError) return <Loading isError>Error Loading Settings</Loading>
    if (settings.isLoading) return <Loading>Loading Settings</Loading>
    if (!settings.isSuccess) return null;
    return <AdminSettingsTabs settingsData={settings.data}/>
}

function AdminSettingsTabs({settingsData}) {
    const { subpage } = useParams();
    const history = useHistory();

    const [activeTab,setActiveTab] = useState('general');

    const navigate = tab => {
        setActiveTab(tab);
        history.push('/admin/settings/'+tab);
    }

    const methods = useForm({defaultValues:defaultVals,values:settingsData});

    const queryclient = useQueryClient();
    const { putSettings } = useSettingsQueries();
    const update = putSettings();
    const handleSubmit = data => {
        console.debug('Save Settings: ',data);
        toast.promise(update.mutateAsync(data),{
            pending:'Saving Settings...',
            success:{
                render:() => {
                    queryclient.invalidateQueries('settings');
                    return 'Settings saved successfully';    
                }
            },
            error:errorToast('Failed saving settings')
        });
    }
    const handleError = error => {
        console.error(error);
    }
    useEffect(()=>setActiveTab(tabs.map(t=>t.id).includes(subpage)?subpage:'general'),[subpage]);
    return (
        <>
            <header>
                <Helmet>
                    <title>{t('admin.settings.title')} - {tabs.filter(t=>t.id==activeTab).at(0)?.title}</title>
                </Helmet>
                <Row>
                    <Col>
                        <h2>{t('admin.settings.title')}</h2>
                    </Col>
                </Row>
                {!!Object.keys(methods.formState.dirtyFields).length && 
                    <Row>
                        <Col>
                            <Alert variant="warning">
                                Unsaved Changes
                            </Alert>
                        </Col>
                    </Row>
                }
            </header>
            <FormProvider {...methods}>
                <Form onSubmit={methods.handleSubmit(handleSubmit,handleError)}>
                    <Row>
                        <Col>
                            <Tabs activeKey={activeTab} onSelect={navigate} id="settings-tabs">
                                {tabs.map(t=>(
                                    <Tab key={t.id} eventKey={t.id} title={t.title}>
                                        <Container as="article" className="mt-3" fluid>
                                            <Row as="header">
                                                <Col as="h3">{t.title}</Col>
                                            </Row>
                                            <SettingsRouter tab={t.id}/>
                                        </Container>
                                    </Tab>
                                ))}
                            </Tabs>
                        </Col>
                    </Row>
                    <Row as="footer">
                        <Col className="button-group justify-content-end">
                            <AppButton format="save" type="submit">Save Settings</AppButton>
                        </Col>
                    </Row>
                </Form>
            </FormProvider>
        </>
    );
}

const SettingsRouter = React.memo(({tab}) => {
    switch(tab) {
        case "general": return <SettingsGeneral/>;
        case "workflow": return <SettingsWorkflow/>;
        case "requests": return <SettingsRequests/>;
        case "forms": return <SettingsForms/>;
        default: return <NotFound/>;
    }
});
