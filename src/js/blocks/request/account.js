import React from "react";
import { Row, Col, Form } from "react-bootstrap";
import { Controller, useWatch, useFormContext } from "react-hook-form";
import { Loading } from "../components";
import SUNYAccount from "../sunyaccount";
import { useRequestContext } from "../../config/request";
import useListsQueries from "../../queries/lists";

export default function Account() {
    const { control, setValue, formState: { errors }} = useFormContext();
    const { canEdit } = useRequestContext();
    const posType = useWatch({name:'posType',control:control});

    const {getListData} = useListsQueries();
    const orgs = getListData('deptOrgs');

    const handleOrgNameChange = (field,e) => {
        field.onChange(e);
        const orgDesc = orgs.data.find(a=>a.DEPARTMENT_CODE==e.target.value)?.DEPARTMENT_DESC;
        setValue('orgName.title',(orgDesc)?orgDesc:'');
    }

    return (
        <>
            {(posType?.id=='F') && 
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Expenditure Type:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="expType"
                            defaultValue=""
                            control={control}
                            render={({field}) => (
                                <>
                                    <Form.Check {...field} inline type="radio" id="expType-PSR" label="PSR" value='PSR' checked={field.value=='PSR'} disabled={!canEdit}/>
                                    <Form.Check {...field} inline type="radio" id="expType-PST" label="PST" value='PST' checked={field.value=='PST'} disabled={!canEdit}/>
                                </>
                            )}
                        />
                    </Col>
                </Form.Group>
            }
            <Form.Group as={Row}>
                <Form.Label column md={2}>Org Name:</Form.Label>
                <Col xs="auto">
                    {orgs.isLoading && <Loading>Loading Department Orgs</Loading>}
                    {orgs.isError && <Loading isError>Error Loading Department Orgs</Loading>}
                    {orgs.data &&
                        <Controller
                            name="orgName.id"
                            defaultValue=""
                            control={control}
                            rules={{required:{value:true,message:'Org Name is required'}}}
                            render={({field}) => (
                                <Form.Control {...field} as="select" onChange={e=>handleOrgNameChange(field,e)} isInvalid={errors.orgName?.id} disabled={!canEdit}>
                                    <option></option>
                                    {orgs.data.map(o=><option key={o.DEPARTMENT_CODE} value={o.DEPARTMENT_CODE}>{o.DEPARTMENT_DESC}</option>)}
                                </Form.Control>
                            )}
                        />
                    }
                    {errors.orgName?.id && <Form.Control.Feedback type="invalid">{errors.orgName.id.message}</Form.Control.Feedback>}
                </Col>
            </Form.Group>
            <SUNYAccount disabled={!canEdit}/>
        </>
    );
}
