/** 
 * @NApiVersion 2.x
 * @NScriptType Restlet
*/


define(['N/record', 'N/format'], function(record, format) {
    function onRequest(context) {

        function isKeySubmitted( key_id )
        {
            for( var i = 0; i < context.items.length; i++) 
            {
                if ( context.items[i]["item_key"] == key_id )
                {
                    return context.items[i];
                }
                return false;
            }
        }
        function formateDate(dt){
            var formattedDateString = format.format({
                value: dt,
                type: format.Type.DATE
            });
        }

        try{
            rec = record.load({
                id: context.po_id,
                type: 'purchaseorder'
            });


            var transform = record.transform({
                fromType: record.Type.PURCHASE_ORDER,
                fromId: context.po_id,
                toType: record.Type.ITEM_RECEIPT
            });

            // COLLECTIONS OF LINE ITEMS THAT NOT SUBMITTED.
            var unfulfilledIndex = [];
            // Count items from sublist
            var lineCount = transform.getLineCount('item');
            // initial a counter
            var counter = 0;

            for( var x = 0; x < lineCount; x++ )
            {
                // Get item Key from sublist
                var item_key = transform.getSublistValue('item', 'itemname', x);
                
                // Check key id is submitted
                var item_submitted = isKeySubmitted(item_key); 

                /**
                 * Set the item warehouse location of item by passing ID
                 * Set the total item qty asigned in warehouse
                 */
                transform.setSublistValue('item', 'location', x, item_submitted.location_id);
                transform.setSublistValue('item', 'quantity', x, item_submitted.qty);


                if( item_submitted )
                {
                    // open inventory detail sub records
                    var inventoryDetail = transform.getSublistSubrecord({
                        sublistId: 'item',
                        fieldId: 'inventorydetail',
                        line: x
                    });

                    // loop thru each received items assigned in different destination
                    for( var obj = 0; obj < item_submitted.assigned.length; obj++ )
                    {
                        var assigned = item_submitted.assigned[obj];

                        /**
                         * create line in sublist inside sub records depends on the
                         * numbers of assigned items per bin location
                         */ 

                        inventoryDetail.setSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'expirationdate',
                            value: formateDate((assigned["expiration_date"])),
                            line: obj
                        }).setSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'binnumber',
                            value: assigned["bin_id"],
                            line: obj
                        }).setSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            value: assigned["qty"],
                            line: obj
                        });
                        inventoryDetail.setSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'receiptinventorynumber',
                            value: assigned["lotnumber"],
                            line: obj
                        });
                    }

                }else{
                    // add item in a list, to uncheck later.
                    unfulfilledIndex.push(x);
                }

            }


            // Uncheck items that is not submitted as received items.
            if( unfulfilledIndex.length >0)
            {
                for (var i = 0; i < unfulfilledIndex.length; i++) {
                    r.setSublistValue('item', 'itemreceive',unfulfilledIndex[i], false);
                }

            }

            // Save the record and get the generated document ID.
            const recordID = transform.save();
            return "Creating item received document submitted with generated ID:  " + recordID;


            
  


        }catch(err){
            return err;
            // return err.message;
        }
    }



    return {
        post: onRequest
    }
});