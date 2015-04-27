var basePath = 'src/angular/';

/*** Controllers ***/
var controllers = angular.module('controllers');

/**
 * For the category/region search view
 */
controllers.controller('SearchCtrl', ['$scope', '$http', '$location', 'ServicesList', 'Search', function ($scope, $http, $location, ServicesList, Search) {

    ServicesList.get(function (data) {
        $scope.services = data;
        // Here we're going to extract the list of categories and display them in a simple template
        
        // use an object to collect service information since object keys won't allow
        // for duplicates (this basically acts as a set)
        var categories = {};
        var regions = {};
        var servicesById = {};
        $.each(data, function (index, service) {
            // add activity and its category to list, and increment counter of this category's available services
            var category = service.properties.activityCategory;
            if (category) {
                if (categories[category] == null) {
                    categories[category] = {activities:{}, count: 0};
                }
                categories[category].count++;

                var activity = service.properties.activityName;
                if (activity) {
                    if (categories[category].activities[activity] == null) {
                        categories[category].activities[activity] = {name: activity, count: 0};
                    }
                    categories[category].activities[activity].count++;
                }
            }
            
            // add region to list, and increment counter of this region's available services
            var region = service.properties.locationName;
            if (region) {
                if (regions[region] == null) {
                    regions[region] = 0;
                }
                regions[region]++;
            }

            var id = service.id;
			if(id) {
				if(servicesById[id] == null) {
					servicesById[id] = service;
				}
//				servicesById[id]++;
			}
        });

        // now to get an array of categories we just map over the keys of the object
        $scope.categories = $.map(categories, function (value, index) {
            return {name: index, count: value.count, activities: value.activities};
        });

        // now to get an array of regions we just map over the keys of the object
        $scope.regions = $.map(regions, function (value, index) {
            return {name: index, count: value};
        });

        $scope.services = $.map(servicesById, function (value, index) {
            return {id: index, service: value};
        });
        Search.setServicesById(servicesById);
    });

    /**
     * When the user clicks on a category, we filter by that category and then navigate to the results view
     */
    $scope.selectCategory = function (category) {
        Search.selectCategory(category);
        $location.path("/results")
    }
}]);


/**
 * For the results view
 */
controllers.controller('ResultsCtrl', ['$scope', 'Search', '$location',  function ($scope, Search, $location) {
    
    // Filtered object based on the categories/regions 
    $scope.results = Search.currResults()
    
    // the methods below serves to get the key value in the object between each ng-repeat loop. 
    // The object is passed in from the view, manipulated then returned back.  

    // gets the opening time of the service 
    $scope.getOpeningTime = function(result){
        //define a variable to store the 'opening time'
        var openingTime = null;

        var timeObject = result.properties["8. Office Open at"];
        // Run this if the office opening time exists 
        if(timeObject){
            // Grabs the key value from the nested object which results in time in string
            openingTime = Object.keys(timeObject)[0];
        } 

        return openingTime;
    }

    // gets the closing time of the service 
    $scope.getClosingTime = function(result){
        //define a variable to store the 'closing time'
        var closingTime = null;
        var timeObject = result.properties["9. Office close at"];
        // Run this if the office closing time exists 
        if(timeObject){
            // Grabs the key value from the nested object which results in time in string
            closingTime = Object.keys(timeObject)[0];
        } 

        return closingTime;
    }

    // gets the activity details of the service 
    $scope.getActivityDetails = function(result){
        // Define a default variable value for activity details
        var activityDetails = ["Unknown"];
        var activities = result.properties["indicators"];
        // filters out the activites with zero count first
        for(key in activities){
            if(activities[key] === 0){
               delete activities[key];
            }
        }
        // if the activity exists we'll assign it to the store variable
        if(Object.keys(activities).length > 0){
             activityDetails = Object.keys(activities);
        } 

        return activityDetails;
    }

    $scope.setServiceId = function (serviceId) {
    	// var url = '/#/services/' + serviceId;
    	$location.path('/services/' + serviceId);
    }
}]);

controllers.controller('NavbarCtrl', ['$scope', function ($scope) {}]);

controllers.controller('ServiceCtrl', ['$scope', '$routeParams', 'Search', function($scope, $routeParams, Search) {
	var servicesById = Search.getServicesById();
	if(servicesById) {
        var service = servicesById[$routeParams.serviceId];
        $scope.service = {};
        $scope.service.id = service.id;
        $scope.service.locationName = service.properties.locationName;
        $scope.service.partnerName = service.properties.partnerName;
        $scope.service.comments = service.properties.comments;
        $scope.service.activityCategory = service.properties.activityCategory;
        $scope.service.activityName = service.properties.activityName;
        $scope.service.startDate = service.properties.startDate;
        $scope.service.endDate = service.properties.endDate;
        $.each(service.properties.indicators, function(index, value) {
            if(value) {
                $scope.service.activityDetails = index;
            }
        });
        var propList = new Array();
        $scope.hours = new Array();
        $.each(service.properties, function(index, value) {
            var tempArray = new Array();
            tempArray = index.split(".");
            if(index != 'comments' && tempArray.length > 1) {
                if($.isNumeric(tempArray[0])) {
                    //TODO: Let's see if we can print it from index rather than creating new object for it again.
                    var obj = {};
                    var level = parseInt(tempArray[0], 10);
                    if(level != 8) {
                        obj.key = $.trim(tempArray[1]);
                        $.each(service.properties[index], function(index, value) {
                            if(value) {
                                obj.value = index;
                            }
                        });
                        propList[level] = obj;
                    } else {
                        $.each(service.properties[index], function(index, value) {
                            if(value) {
                                $scope.hours.push(index);
                            }
                        });
                    }
                }
            }
        });
        propList = $.grep(propList, function(n){ return(n) });
        $scope.service.properties = propList;
    }
}]);

/*** End Controllers ***/
