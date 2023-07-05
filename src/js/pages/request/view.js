import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import { useForm, FormProvider } from "react-hook-form";
import { Redirect, useHistory, useParams } from "react-router-dom";
import { RequestContext, tabs, defaultVals } from "../../config/request";
import { get, merge } from "lodash";
import { AppButton } from "../../blocks/components";
import useRequestQueries from "../../queries/requests";
import Review from "../../blocks/request/review";

export default function RequestArchiveView() {
    const { id } = useParams();
    const history = useHistory();

    const [showReturn,setShowReturn] = useState(false);
    const [redirect,setRedirect] = useState('');

    const { getArchiveRequest } = useRequestQueries(id);
    const reqData = getArchiveRequest();

    const handleReturnToList = () => setRedirect(get(history.location,'state.from',''));
    useEffect(()=>setShowReturn(get(history.location,'state.from','').startsWith('/request/list')),[history]);

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
                {reqData.data && <RequestViewData data={reqData.data}/>}
            </section>
        </>
    );
}

function RequestViewData({data}) {
    const methods = useForm({defaultValues: merge({},defaultVals,data)});
    return (
        <FormProvider {...methods}>
            <RequestContext.Provider value={{
                reqId:data.reqId,
                isDraft:false,
                canEdit:false
            }}>
                <Review/>
            </RequestContext.Provider>
        </FormProvider>
    );
}