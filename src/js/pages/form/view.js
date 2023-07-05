import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Alert } from "react-bootstrap";
import { initFormValues, allTabs, HRFormContext } from "../../config/form";
import { useForm, FormProvider } from "react-hook-form";
import { Redirect, useHistory, useParams } from "react-router-dom";
import useFormQueries from "../../queries/forms";
import { get, merge } from "lodash";
import Review from "../../blocks/form/review";
import { AppButton } from "../../blocks/components";

export default function HRFormArchiveView() {
    const { id } = useParams();
    const history = useHistory();

    const [showReturn,setShowReturn] = useState(false);
    const [redirect,setRedirect] = useState('');

    const { getArchiveForm } = useFormQueries(id);
    const formData = getArchiveForm();

    const handleReturnToList = () => setRedirect(get(history.location,'state.from',''));
    useEffect(()=>setShowReturn(get(history.location,'state.from','').startsWith('/form/list')),[history]);

    if (redirect) return <Redirect to={redirect}/>;
    return (
        <>
            <section>
                <header>
                    <Row>
                        <Col>
                            <h2>Archive View {showReturn && <AppButton format="previous" onClick={handleReturnToList}>Return to List</AppButton>}</h2>
                        </Col>
                    </Row>
                </header>
                <Alert variant="warning">
                    {/*TODO: finish */}
                    This page is still under construction and may not display all information correctly.
                </Alert>
                {formData.data && <HRFormViewData data={formData.data}/>}
            </section>
        </>
    );
}

function HRFormViewData({data}) {
    const methods = useForm({defaultValues: merge({},initFormValues,data)});
    const formType = useMemo(()=>{
        const formActions = methods.getValues('formActions');
        return [formActions?.formCode?.FORM_CODE,formActions?.actionCode?.ACTION_CODE,formActions?.transactionCode?.TRANSACTION_CODE].join('-');
    },[methods]);
    return (
        <FormProvider {...methods}>
            <HRFormContext.Provider value={{
                tabs:allTabs,
                isDraft:false,
                isNew:false,
                infoComplete:true,
                journalStatus:'Z',
                canEdit:false,
                formType:formType,
                sunyId:methods.getValues('person.information.SUNY_ID'),
                hrPersonId:methods.getValues('person.information.HR_PERSON_ID'),
                isTest:methods.getValues('formActions.formCode.id')=='TEST',
                showInTest:false
            }}>
                <Review/>
            </HRFormContext.Provider>
        </FormProvider>
    );
}