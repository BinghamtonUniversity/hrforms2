import React, { useEffect, useState } from "react";
import { Row, Col, Form, InputGroup, Button, Table } from "react-bootstrap";
import { Controller, useWatch, useFieldArray, useFormContext } from "react-hook-form";
import { useAppQueries } from "../queries";
import { Typeahead } from "react-bootstrap-typeahead";
import { Icon } from '@iconify/react';
import { get, camelCase } from "lodash";
import { Loading } from "./components";

export default function SUNYAccount(props) {
    const name = props.name||'SUNYAccounts';
    const {control,getValues,setValue} = useFormContext();
    const { fields, append, remove } = useFieldArray({control,name:name});

    const [showSplit,setShowSplit] = useState(false);

    const {getListData} = useAppQueries();
    const accounts = getListData('accounts',{select:d=>{
        return d.map(a=>{return {id:a.ACCOUNT_CODE,label:`${a.ACCOUNT_CODE} - ${a.ACCOUNT_DESCRIPTION}`}});
    }});
    const toggleSplit = () => {
        if (!showSplit){
            //make sure there are at least 2 accounts and set first account pct to empty
            const fName = (getValues(name)[0].account[0]?.id)?'pct':'account';
            for (let i = fields.length;i<2;i++) {
                append({account:[],pct:''},{focusName:`${name}.0.${fName}`});
            }
            setValue(`${name}.0.pct`,'');
        } else {
            //remove splits
            for (let i=1;i<fields.length;i++) {
                remove(i);
            }
            setValue(`${name}.0.pct`,'100');
        }
        setValue(`${name}Split`,!showSplit);
        setShowSplit(!showSplit);
    }
    const splitAction = (action,index) => {
        if (action=='add') append({account:[],pct:''});
        if (action=='remove') {
            remove(index);
            if (fields.length <= 2) setShowSplit(false);
        }
    }
    const handleBlur = (field,index,e) => {
        field.onBlur(e);
        if (e.target.value != getValues(`${name}.${index}.account[0].label`)) {
            setValue(`${name}.${index}.account.0`,{id:`new-id-${index}`,label:e.target.value});
        }
    }
    useEffect(()=>setShowSplit(getValues(`${name}Split`)),[]);
    return(
        <>
            <Form.Group as={Row}>
                <Form.Label column md={2}>SUNY Account:</Form.Label>
                <Col xl={5} lg={6} md={7}>
                    {accounts.isLoading && <Loading>Loading SUNY Accounts</Loading>}
                    {accounts.isError && <Loading isError>Error Loading SUNY Accounts</Loading>}
                    {accounts.data && 
                        <InputGroup>
                            <Controller
                                name={`${name}.0.account`}
                                defaultValue=""
                                control={control}
                                render={({field})=><Typeahead 
                                    {...field} 
                                    id={camelCase(`${name}.0.account`)}
                                    options={accounts.data} 
                                    flip={true} 
                                    minLength={2} 
                                    allowNew={true} 
                                    selected={field.value} 
                                    onBlur={e=>handleBlur(field,0,e)} 
                                    disabled={showSplit||props.disabled}
                                />}
                            />
                            {!props.noSplit &&
                                <InputGroup.Append>
                                    <Button variant={(showSplit)?'secondary':'primary'} onClick={()=>toggleSplit()} disabled={props.disabled}>Split</Button>
                                </InputGroup.Append>
                            }
                        </InputGroup>
                    }
                </Col>
            </Form.Group>
            {(!props.noSplit&&showSplit) && <SplitTable accounts={accounts.data} fields={fields} splitAction={splitAction} handleBlur={handleBlur} disabled={props.disabled} name={name}/>}
        </>
    );
}

export function SingleSUNYAccount(props) {
    const {control, getValues, setValue } = useFormContext();

    const {getListData} = useAppQueries();
    const accounts = getListData('accounts',{select:d=>{
        return d.map(a=>{return {id:a.ACCOUNT_CODE,label:`${a.ACCOUNT_CODE} - ${a.ACCOUNT_DESCRIPTION}`}});
    }});

    const handleBlur = (field,e) => {
        field.onBlur(e);
        if (e.target.value != getValues(`${props.name}[0].label`)) {
            setValue(`${props.name}.0`,{id:'new-id-0',label:e.target.value});
        }
    }

    return (
        <>
            {accounts.data && 
                <Controller
                    name={props.name}
                    defaultValue=""
                    control={control}
                    render={({field})=><Typeahead 
                        {...field} 
                        id={camelCase(props.name)}
                        options={accounts.data} 
                        flip={true} 
                        minLength={2} 
                        allowNew={true} 
                        onBlur={e=>handleBlur(field,e)}
                        selected={field.value} 
                        disabled={props.disabled}
                    />}
                />
            }
        </>
    );
}

function SplitTable({accounts,fields,splitAction,handleBlur,disabled,name}) {
    const [splitPct,setSplitPct] = useState(0);
    
    const {control,formState:{errors}} = useFormContext();
    const watchSUNYAccounts = useWatch({name:name,control:control});

    useEffect(() => {
        if (!watchSUNYAccounts) return;
        let total = 0;
        watchSUNYAccounts.forEach(s=>total+=parseInt(s.pct||0,10));
        setSplitPct(total);
    },[watchSUNYAccounts]);

    return (
        <Table className="split-account-table" striped bordered>
            <thead>
                <tr>
                    <th scope="col">Action</th>
                    <th scope="col">Account</th>
                    <th scope="col">Percent</th>
                </tr>
            </thead>
            <tfoot>
                <tr>
                    <td colSpan={2}>Total: {splitPct!=100&&<span className="text-muted font-italic font-size-90">(Remaining: {100-parseInt(splitPct,10)}%)</span>}</td>
                    <td className="text-right"><span className={(splitPct==100)?'text-success':'text-danger'}>{splitPct}%</span></td>
                </tr>
            </tfoot>
            <tbody>
                {fields.map((field,index)=>{
                    return (
                        <tr key={field.id}>
                            <td className="align-middle">
                                {index >0 && 
                                    <div className="button-group">
                                        <Button className="no-label" variant="success" size="sm" onClick={()=>splitAction('add',index)} tabIndex="-1"><Icon icon="mdi:plus"/></Button>
                                        <Button className="no-label" variant="danger" size="sm" onClick={()=>splitAction('remove',index)} tabIndex="-1"><Icon icon="mdi:minus"/></Button>
                                    </div>
                                }
                            </td>
                            <td>
                                {accounts &&
                                    <Controller
                                        name={`${name}.${index}.account`}
                                        defaultValue=""
                                        control={control}
                                        render={({field})=><Typeahead 
                                            {...field} 
                                            id={camelCase(`${name}.${index}.account`)} 
                                            options={accounts} 
                                            flip={true} 
                                            minLength={2} 
                                            allowNew={true} 
                                            selected={field.value} 
                                            onBlur={e=>handleBlur(field,index,e)} 
                                            disabled={disabled}
                                        />}
                                    />
                                }
                            </td>
                            <td className="text-right">
                                <Controller
                                    name={`${name}.${index}.pct`}
                                    defaultValue=""
                                    rules={{
                                        required:{value:true,message:'Percentage is required'},
                                        min:{value:1,message:'Percentage cannot be less than 1'},
                                        max:{value:100,message:'Percentage cannot be more than 100'}
                                    }}
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="number" title={get(errors,`${name}.${index}.pct.message`)} isInvalid={get(errors,`${name}.${index}.pct`)} disabled={disabled}/>}
                                />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    );
}
