import React, { useMemo, useState } from "react";
import { initFormValues, allTabs, HRFormContext } from "../../config/form";
import { useForm, FormProvider } from "react-hook-form";
import { useParams, Redirect } from "react-router-dom";
import useFormQueries from "../../queries/forms";
import { merge, cloneDeep, get } from "lodash";
import Review from "../../blocks/form/review";
import { Loading } from "../../blocks/components";

export default function HRFormArchiveView({formId}) {
    const { id } = useParams();

    const [redirect,setRedirect] = useState('');

    const { getArchiveForm } = useFormQueries(id||formId);
    const formData = getArchiveForm({
        onSuccess:data=>{
            console.debug('Form Data Fetched:\n',data);
            if (get(data,'redirect',false)) {
                console.warn(`Invalid path, redirecting to ${data.newpath}`);
                setRedirect(data.newpath);
            }
        },
        onError:e=>{
            console.error(e);
        }
    });

    if (redirect) return <Redirect to={redirect}/>;
    if (formData.isError) return <Loading type="alert" isError>Failed To Load Form Data - <small>{formData.error?.name} - {formData.error?.description||formData.error?.message}</small></Loading>;
    if (!formData.data) return <Loading type="alert">Loading Form Data</Loading>;
    return (
        <section>
            {formData.data && <HRFormViewData data={formData.data}/>}
        </section>
    );
}

function HRFormViewData({data}) {
    const methods = useForm({defaultValues: merge({},initFormValues,data)});
    const formType = useMemo(()=>{
        const formActions = methods.getValues('formActions');
        return [formActions?.formCode?.FORM_CODE,formActions?.actionCode?.ACTION_CODE,formActions?.transactionCode?.TRANSACTION_CODE].join('-');
    },[methods]);
    const tablist = useMemo(()=>{
        const tabs = data.formActions.TABS;
        const tlist = [allTabs.find(t=>t.value=='basic-info')];
        ['person','employment'].forEach(t=>{
            if (tabs.filter(v=>v.startsWith(t)).length>0) {
                const subTabs = cloneDeep(allTabs.find(v=>v.value==t));
                subTabs.children = subTabs.children.filter(s=>tabs.includes(s.value));
                tlist.push(subTabs);
            }
        });
        tlist.push(...allTabs.filter(t=>['comments','review'].includes(t.value)));
        return tlist;
    },[allTabs,data]);
    return (
        <FormProvider {...methods}>
            <HRFormContext.Provider value={{
                tabs:tablist,
                isDraft:false,
                isNew:false,
                infoComplete:true,
                journalStatus:'Z',
                canEdit:false,
                formType:formType,
                sunyId:methods.getValues('person.information.SUNY_ID'),
                hrPersonId:methods.getValues('person.information.HR_PERSON_ID'),
                isTest:methods.getValues('formActions.formCode.id')=='TEST',
                showInTest:false,
                createdBy:data.createdBy
            }}>
                <Review/>
            </HRFormContext.Provider>
        </FormProvider>
    );
}