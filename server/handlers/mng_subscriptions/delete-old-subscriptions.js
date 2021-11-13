import axios from "axios";

export const deleteOldSubscriptions = async (ctx) => {
    const reqBody = ctx.request.body;

    const customerId = reqBody.subscription.customer_id || null;
    const addressId = reqBody.subscription.address_id || null;
    const subscriptionId = reqBody.subscription.id || null;

    const response = await axios.get(
        `${process.env.RECHARGE_API_URL}/customers/${customerId}/addresses`,
        {
            headers: {
                'X-ReCharge-Access-Token': process.env.RECHARGE_API_KEY,
                Accept: 'application/json',
                "Content-Type": "application/json"
            },
        })
        .then(response  =>  {   return response })
        .catch(error    =>  {   return error.response   });
    
    if (response.status != 200) return;
    
    let addresses = response.data.addresses.filter( addr => {
       return addr.id != addressId;
    });

    if(addresses.length == 0) {
        ctx.status = 200;
        return;
    }

    for(const addr of addresses) {

        const response2 = await axios.get(
            `${process.env.RECHARGE_API_URL}/subscriptions?address_id=${addr.id}`,
            {
                headers: {
                    'X-ReCharge-Access-Token': process.env.RECHARGE_API_KEY,
                    Accept: 'application/json',
                    "Content-Type": "application/json"
                },
            })
            .then(response  =>  {   return response })
            .catch(error    =>  {   return error.response   });
        
        let subscriptions = response2.data.subscriptions;
        
        if (subscriptions.length == 0) {
            const response4 = await axios.delete(
                `${process.env.RECHARGE_API_URL}/addresses/${addr.id}`,
                {
                    headers: {
                        'X-ReCharge-Access-Token': process.env.RECHARGE_API_KEY,
                        Accept: 'application/json',
                        "Content-Type": "application/json"
                    },
                })
                .then(response  =>  {   return response })
                .catch(error    =>  {   return error.response   });
            continue;
        }

        let data = {
            "subscriptions": [],
            "send_email":0
        }
        
        for(const subscription of subscriptions) {
            data.subscriptions.push({
                "id": subscription.id
            })
        }

        const options = {
            method: 'DELETE',
            headers: { 
                'X-ReCharge-Access-Token': process.env.RECHARGE_API_KEY,
                Accept: 'application/json',
                "Content-Type": "application/json"
            },
            data: data,
            url: `${process.env.RECHARGE_API_URL}/addresses/${addr.id}/subscriptions-bulk`,
          };
        
        const response3 = await axios(options)
            .then(response  =>  {   return response })
            .catch(error    =>  {   return error.response   });
        
        //delete address

        const response5 = await axios.delete(
            `${process.env.RECHARGE_API_URL}/addresses/${addr.id}`,
            {
                headers: {
                    'X-ReCharge-Access-Token': process.env.RECHARGE_API_KEY,
                    Accept: 'application/json',
                    "Content-Type": "application/json"
                },
            })
            .then(response  =>  {   return response })
            .catch(error    =>  {   return error.response   });
        console.log(" -------- response5 => ", response5.data);
    }
    
    console.log(" -------- Deleted the old subscriptions ---");
    ctx.status = 200;

};
