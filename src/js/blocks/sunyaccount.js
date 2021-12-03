import React, { useEffect, useState } from "react";
import { Row, Col, Form, InputGroup, Button, Table } from "react-bootstrap";
import { Controller, useWatch, useFieldArray } from "react-hook-form";
import { useAppQueries } from "../queries";
import { Typeahead } from "react-bootstrap-typeahead";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { get } from "lodash";
import { Loading } from "./components";

export default function SUNYAccount({control,errors}) {
    const [previousSplit,setPreviousSplit] = useState([{account:'',pct:'100'}]);
    const { fields, append, update, replace } = useFieldArray({control,name:'SUNYAccounts'});

    const {getListData} = useAppQueries();
    const accounts = getListData('accounts',{select:d=>{
        return d.map(a=>{return {id:a.ACCOUNT_CODE,label:`${a.ACCOUNT_CODE} - ${a.ACCOUNT_DESCRIPTION}`}});
    }});

    const toggleSplit = () => {
        if (fields.length < 2) {
            if (fields.length < 2) append({account:'',pct:''},{focusIndex:0});
            if (previousSplit.length > 1) replace(previousSplit);
        } else {
            replace([{account:previousSplit[0].account,pct:'100'}]);
        }
    }
    return(
        <>
            <Form.Group as={Row}>
                <Form.Label column md={2}>SUNY Account:</Form.Label>
                <Col id="col-SUNYAccount">
                    {accounts.isLoading && <Loading>Loading SUNY Accounts</Loading>}
                    {accounts.isError && <Loading isError>Error Loading SUNY Accounts</Loading>}
                    {accounts.data && 
                        <InputGroup>
                            <AccountTypeAhead accounts={accounts.data} index={0} field={{...fields[0],disabled:(fields.length>1)}} update={update}/>
                            <InputGroup.Append>
                                <Button variant={(fields.length<2)?'primary':'secondary'} onClick={toggleSplit}>Split</Button>
                            </InputGroup.Append>
                        </InputGroup>
                    }
                </Col>
            </Form.Group>
            {(fields.length>1)&&<AccountSplits control={control} accounts={accounts.data} setPreviousSplit={setPreviousSplit} errors={errors}/>}
        </>
    );
}

function AccountSplits({control,accounts,setPreviousSplit,errors}) {
    const [splitPct,setSplitPct] = useState(0);
    const watchSUNYAccounts = useWatch({name:'SUNYAccounts',control:control});

    const { fields, update, append, remove } = useFieldArray({control,name:'SUNYAccounts'});

    useEffect(() => {
        if (!watchSUNYAccounts) return;
        let total = 0;
        watchSUNYAccounts.forEach(s=>total += parseInt(s.pct||0,10));
        setSplitPct(total);
        setPreviousSplit(watchSUNYAccounts);
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
                    <td colSpan={2}>Total:</td>
                    <td className="text-right"><span className={(splitPct==100)?'text-success':'text-danger'}>{splitPct}%</span></td>
                </tr>
            </tfoot>
            <tbody>
                {fields.map((field,index)=>{
                    return (
                        <tr key={field.id}>
                            <td>
                                <Button className="mr-2" variant="success" size="sm" onClick={()=>append({account:"",pct:""})}><FontAwesomeIcon icon="plus-square"/></Button>
                                <Button variant="danger" size="sm" onClick={()=>remove(index)}><FontAwesomeIcon icon="minus-square"/></Button>
                            </td>
                            <td>
                                <AccountTypeAhead accounts={accounts} index={index} field={field} update={update}/>
                            </td>
                            <td className="text-right">
                                <Controller
                                    name={`SUNYAccounts.${index}.pct`}
                                    defaultValue=""
                                    rules={{
                                        min:{value:1,message:'Percentage cannot be less than 1'},
                                        max:{value:100,message:'Percentage cannot be more than 100'}
                                    }}
                                    control={control}
                                    render={({field}) => <Form.Control {...field} type="number" title={get(errors.SUNYAccounts,`${index}.pct.message`)} isInvalid={get(errors.SUNYAccounts,`${index}.pct`)}/>}
                                />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    );
}

function AccountTypeAhead({accounts,field,index,update}) {
    const [acctNum,setAcctNum] = useState([]);
    const acctNumChange = v => {
        setAcctNum(v);
        update(index,{account:v[0],pct:field.pct});
    }
    useEffect(() => {
        field.account && setAcctNum([field.account]);
    },[index]);
    return (
        <Typeahead id={`SUNYAccount-${index}`} options={accounts} flip={true} minLength={2} allowNew={true} selected={acctNum} onChange={acctNumChange} disabled={field.disabled}/>
    );
}
