/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */

define([ 'N/record', 'N/search'], function(r, s) {
    function onSendRequst(context) 
    {

        /**
         *  Create initial record
        */
        var rec = r.create({
            type: context.recordtype,
            isDynamic: true
        });


        // Set Transfer information using Location internal ID
        rec.setValue( 'location', context.from_location_id );
        rec.setValue( 'transferlocation', context.to_location_id );

        // Set record memo field
        rec.setValue( 'memo', context.memo );     
        
        /**
         * Loop thru each json items to adjust
         * Sublist Fields
         */
        for( var i = 0; i < context.inventory.length; i++)
        {
            var inv = context.inventory;

            // Create sublist Record
            rec.selectNewLine({
                sublistId: 'inventory',
                line: i+1
            }).setCurrentSublistValue({
                sublistId: 'inventory',
                fieldId: 'item',
                value: inv[i].item_ndc
                
            }).setCurrentSublistValue({
                sublistId: 'inventory',
                fieldId: 'adjustqtyby',
                value: inv[i].qty
            });

            
            /**
             * Create sub record for each JSON Bins to transfer
             * -Lot internal ID
             * -From bin internal ID
             * -To bin internal ID
             * -Qty to transfer
             */
            var itemInventorySubrecord = rec.getCurrentSublistSubrecord({
                sublistId: 'inventory',
                fieldId: 'inventorydetail',
                line: i
            });

            for( var line = 0; line < inv[i]["bins"].length; line++)
            {
                var invRec  = inv[i]["bins"][line]
                var lot     = invRec.lot;
                var from    = invRec.from;
                var to      = invRec.to;
                var qty     = invRec.qty;
                // lot collumn
                itemInventorySubrecord.setCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'issueinventorynumber',
                    value: invRec["lot"],
                    line: line + 1
                }).setCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'binnumber',
                    value: invRec["from"],
                    line: line
                }).setCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'tobinnumber',
                    value: invRec["to"],
                    line: line
                }).setCurrentSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'quantity',
                    value: invRec["qty"],
                    line: line
                });

                // Commit each line
                itemInventorySubrecord.commitLine({
                    sublistId: 'inventoryassignment'
                });
            }

            // Commit created
            rec.commitLine({
				sublistId: 'inventory'
            });
        }
        // Save Record
        var recordId = rec.save({
			enableSourcing: true,
 			ignoreMandatoryFields: true
		});

        // Return created internal ID record.
        return recordId;
    }

    return {
        post: onSendRequst
    }
    
});
