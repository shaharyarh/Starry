({
    getHtml: function(emailMessageRelation) {
        if (emailMessageRelation.RelationId) {
            return '<a href="/' + emailMessageRelation.RelationId + '">' + emailMessageRelation.Relation.Name.replace(/</g,'&lt;').replace(/</g,'&gt;') + '</a>';
        }

        return '<a href="mailto:' + emailMessageRelation.RelationAddress + '">' + emailMessageRelation.RelationAddress.replace(/</g,'&lt;').replace(/</g,'&gt;') + '</a>';
    }
})