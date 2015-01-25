'use strict';

angular
  .module('gmapsZoneCreatorApp')
  .directive('hatanianGmap', function () {
    var map, newPolygons, infoWindow;
    var marker = new google.maps.Marker({
      title: 'Your test address'
    });
    return {
      restrict: 'E',
      transclude: false,
      template: '<div></div>',
      replace: true,
      scope: {
        addMarker: "=addMarker",
        onSplitted: '&onSplitted',
        onSplittingStart: '&onSplittingStart',
        onFirstSegmentDrawn: '&onFirstSegmentDrawn'
      },
      link: function link($scope, element) {
        $scope.$watch("addMarker", function (newValue, oldValue) {
          if (newValue && newValue.lat && newValue.lng) {
            marker.setPosition(newValue);
            marker.setMap(map);
            var content = "This address is in none of the zones !"
            if (google.maps.geometry.poly.containsLocation(marker.getPosition(), newPolygons[0])) {
              content = "This address is in zone 1 (dark blue)";
            } else if (google.maps.geometry.poly.containsLocation(marker.getPosition(), newPolygons[1])) {
              content = "This address is in zone 2 (light blue)";
            }
            var infowindow = new google.maps.InfoWindow({
              content: content
            });
            infowindow.open(map, marker);
          }
        });

        $scope.splittingMode = false;
        $scope.firstSegmentDrawn = false;
        var mapOptions = {
          center: {lat: 47.586512, lng: 1.333706},
          zoom: 9
        };
        map = new google.maps.Map(element[0], mapOptions);

        var loirEtCherPolylineOptions = {
          path: LOIR_ET_CHER_PATH,
          strokeColor: '#FF0000',
          strokeOpacity: 1.8,
          strokeWeight: 5,
          fillColor: '#FF0000',
          fillOpacity: 1,
          editable: false,
          zIndex: 1,
          map: map
        };

        var loirEtCherPolyline = new google.maps.Polyline(loirEtCherPolylineOptions);

        var loirEtCherPolygon = new google.maps.Polygon({
          paths: LOIR_ET_CHER_PATH,
          strokeColor: '#FF0000',
          strokeOpacity: 1.8,
          strokeWeight: 2,
          fillColor: '#FF0000',
          fillOpacity: 0.35,
          editable: false,
          zIndex: 0,
          map: map
        });

        var newPolyline;

        google.maps.event.addListener(loirEtCherPolyline, 'click', function (event) {
          if ($scope.splittingMode) {
            $scope.splittingMode = false;
            newPolyline.getPath().push(event.latLng);
            $scope.splitted = true;
            newPolygons = finalizeSplit(newPolyline, loirEtCherPolygon, loirEtCherPolyline);
            if ($scope.onSplitted) {
              $scope.onSplitted();
            }
          } else {
            console.log("Start splitting");
            newPolyline = new google.maps.Polyline({
              path: [event.latLng],
              strokeColor: '#000000',
              strokeOpacity: 1.8,
              strokeWeight: 4,
              fillColor: '#000000',
              fillOpacity: 1,
              editable: false,
              zIndex: 2,
              map: map
            });
            $scope.splittingMode = true;
            if ($scope.onSplittingStart) {
              $scope.onSplittingStart();
            }
          }
        });

        google.maps.event.addListener(loirEtCherPolygon, 'click', function (event) {
          if ($scope.splittingMode) {
            if (!$scope.firstSegmentDrawn) {
              $scope.firstSegmentDrawn = true;
              $scope.onFirstSegmentDrawn();
            }
            newPolyline.getPath().push(event.latLng);
          }
        });

        google.maps.event.addListener(loirEtCherPolyline, 'mouseover', function (event) {
          if (!$scope.splitted) {
            loirEtCherPolylineOptions.strokeColor = "#000000";
            loirEtCherPolyline.setOptions(loirEtCherPolylineOptions);
          }
        });

        google.maps.event.addListener(loirEtCherPolyline, 'mouseout', function (event) {
          if (!$scope.splitted) {
            loirEtCherPolylineOptions.strokeColor = "#FF0000";
            loirEtCherPolyline.setOptions(loirEtCherPolylineOptions);
          }
        });
      }
    }
  }
)
;

function finalizeSplit(newPolyline, loirEtCherPolygon, loirEtCherPolyline) {
  function lineContains(lineStart, lineEnd, point) {
    var tolerance = Math.pow(map.getZoom(), -(map.getZoom() / 5));
    var segment = new google.maps.Polyline({
      path: [lineStart, lineEnd]
    });
    return google.maps.geometry.poly.isLocationOnEdge(point, segment, tolerance);
  };

  var map = newPolyline.getMap();
  var newPath = newPolyline.getPath();
  var startPointLatLng = newPath.getAt(0);
  var endPointLatLng = newPath.getAt(newPath.getLength() - 1);

  var poly1 = new google.maps.Polygon({
    paths: [[]],
    strokeColor: '#005CAA',
    strokeOpacity: 1.8,
    strokeWeight: 2,
    fillColor: '#005CAA',
    fillOpacity: 0.35,
    editable: false,
    zIndex: 0,
    map: map
  });

  var poly2 = new google.maps.Polygon({
    paths: [[]],
    strokeColor: '#75E3D2',
    strokeOpacity: 1.8,
    strokeWeight: 2,
    fillColor: '#75E3D2',
    fillOpacity: 0.35,
    editable: false,
    zIndex: 0,
    map: map
  });

  var currentNewPoly = poly1;
  var loirEtCherPath = loirEtCherPolyline.getPath();
  var previousPoint = loirEtCherPath.getAt(loirEtCherPath.getLength() - 1);
  var startPointAlreadyFound = false;
  var endPointAlreadyFound = false;
  for (var i = 0; i < loirEtCherPath.getLength(); i++) {
    var item = loirEtCherPath.getAt(i);
    if (!startPointAlreadyFound && lineContains(previousPoint, item, startPointLatLng)) {
      startPointAlreadyFound = true;
      for (var indexOfPolyline = 0; indexOfPolyline < newPolyline.getPath().getLength(); indexOfPolyline++) {
        currentNewPoly.getPath().push(newPolyline.getPath().getAt(indexOfPolyline));
      }
      ;
      if (currentNewPoly == poly1) {
        currentNewPoly = poly2;
      } else {
        currentNewPoly = poly1;
      }
    } else if (!endPointAlreadyFound && lineContains(previousPoint, item, endPointLatLng)) {
      endPointAlreadyFound = true;
      for (var indexOfReversePolyline = newPolyline.getPath().getLength() - 1; indexOfReversePolyline >= 0; indexOfReversePolyline--) {
        currentNewPoly.getPath().push(newPolyline.getPath().getAt(indexOfReversePolyline));
      }
      ;
      if (currentNewPoly == poly1) {
        currentNewPoly = poly2;
      } else {
        currentNewPoly = poly1;
      }
    }
    currentNewPoly.getPath().push(item);
    previousPoint = item;
  }

  newPolyline.setMap(null);
  loirEtCherPolygon.setMap(null);
  loirEtCherPolyline.setMap(null);

  return [poly1, poly2];
}

var LOIR_ET_CHER_PATH = [
  {lng: 1.26059414, lat: 47.96852404000001},
  {lng: 1.26539644, lat: 47.96285805},
  {lng: 1.29957233, lat: 47.96815754000001},
  {lng: 1.30592226, lat: 47.95639608},
  {lng: 1.30862468, lat: 47.95375775000001},
  {lng: 1.33820383, lat: 47.95776439},
  {lng: 1.34970649, lat: 47.96342005000001},
  {lng: 1.37000993, lat: 47.95374172},
  {lng: 1.38625993, lat: 47.98067635},
  {lng: 1.40718626, lat: 47.97060011000001},
  {lng: 1.43231229, lat: 47.97516786000001},
  {lng: 1.43723189, lat: 47.97649184},
  {lng: 1.43950215, lat: 47.98318322},
  {lng: 1.43519544, lat: 48.00316824},
  {lng: 1.4325978, lat: 48.00851715},
  {lng: 1.44139028, lat: 48.01162443},
  {lng: 1.45565049, lat: 48.00843214},
  {lng: 1.49074921, lat: 47.99010218000001},
  {lng: 1.4937145, lat: 47.98738964000001},
  {lng: 1.51116991, lat: 47.98388984},
  {lng: 1.52011639, lat: 47.9822709},
  {lng: 1.55140462, lat: 47.98964367},
  {lng: 1.56067457, lat: 47.98787092},
  {lng: 1.56481308, lat: 47.98976887000001},
  {lng: 1.56444069, lat: 47.97312005000001},
  {lng: 1.54784631, lat: 47.96153391000001},
  {lng: 1.54699923, lat: 47.95819168},
  {lng: 1.5559455, lat: 47.95531094},
  {lng: 1.55220249, lat: 47.95312749},
  {lng: 1.53346622, lat: 47.94918620000001},
  {lng: 1.52622692, lat: 47.94464044000001},
  {lng: 1.52262254, lat: 47.93186272},
  {lng: 1.52542157, lat: 47.92911220000001},
  {lng: 1.55358001, lat: 47.92075151},
  {lng: 1.5758126, lat: 47.90617607},
  {lng: 1.57918115, lat: 47.90352689},
  {lng: 1.57728976, lat: 47.89739900000001},
  {lng: 1.58142284, lat: 47.89174097},
  {lng: 1.57905383, lat: 47.88900147},
  {lng: 1.58863023, lat: 47.87758737},
  {lng: 1.58344495, lat: 47.87184306},
  {lng: 1.58362654, lat: 47.86848059},
  {lng: 1.54898118, lat: 47.84338414},
  {lng: 1.53594921, lat: 47.83849271},
  {lng: 1.53136951, lat: 47.82860297},
  {lng: 1.52792286, lat: 47.82262604},
  {lng: 1.52717231, lat: 47.81931106},
  {lng: 1.5408545, lat: 47.81701284},
  {lng: 1.56675431, lat: 47.7990369},
  {lng: 1.57023193, lat: 47.79671239},
  {lng: 1.56725198, lat: 47.78867907},
  {lng: 1.57124061, lat: 47.78696049},
  {lng: 1.55085396, lat: 47.77220938},
  {lng: 1.54781181, lat: 47.76953555},
  {lng: 1.59797701, lat: 47.739734},
  {lng: 1.58731186, lat: 47.73206571},
  {lng: 1.58312881, lat: 47.72997092},
  {lng: 1.58285919, lat: 47.72643352},
  {lng: 1.61938109, lat: 47.73947209},
  {lng: 1.62759917, lat: 47.75606269},
  {lng: 1.62926182, lat: 47.75940063},
  {lng: 1.6522159, lat: 47.74920356},
  {lng: 1.65569579, lat: 47.74719129},
  {lng: 1.67312854, lat: 47.73947604},
  {lng: 1.69380519, lat: 47.73878349000001},
  {lng: 1.71226318, lat: 47.73261415000001},
  {lng: 1.71306692, lat: 47.72209529},
  {lng: 1.72565986, lat: 47.70270761},
  {lng: 1.72805435, lat: 47.69956318},
  {lng: 1.72379963, lat: 47.69765205000001},
  {lng: 1.71936995, lat: 47.69591971},
  {lng: 1.72148455, lat: 47.69279191},
  {lng: 1.72809551, lat: 47.68785374},
  {lng: 1.74004486, lat: 47.66184913},
  {lng: 1.74671719, lat: 47.65675638},
  {lng: 1.77647203, lat: 47.65286513000001},
  {lng: 1.78056525, lat: 47.65084306000001},
  {lng: 1.77869364, lat: 47.64414224},
  {lng: 1.78965226, lat: 47.63720567},
  {lng: 1.79445409, lat: 47.63612186},
  {lng: 1.80256752, lat: 47.64049477},
  {lng: 1.80448148, lat: 47.64737529},
  {lng: 1.81141853, lat: 47.65250668},
  {lng: 1.84537913, lat: 47.65936501},
  {lng: 1.84374573, lat: 47.68327389},
  {lng: 1.84953344, lat: 47.68829008},
  {lng: 1.85445183, lat: 47.68940698},
  {lng: 1.86290431, lat: 47.68860616},
  {lng: 1.86586735, lat: 47.67594534},
  {lng: 1.89078206, lat: 47.67776059000001},
  {lng: 1.89905821, lat: 47.67382649},
  {lng: 1.90899565, lat: 47.67508670000001},
  {lng: 1.91398103, lat: 47.67448433},
  {lng: 1.92754874, lat: 47.67822052000001},
  {lng: 1.93716904, lat: 47.67757942},
  {lng: 1.94206866, lat: 47.66182928},
  {lng: 1.95635174, lat: 47.66199295},
  {lng: 1.96497396, lat: 47.65891874},
  {lng: 1.97722533, lat: 47.66429987},
  {lng: 1.98189036, lat: 47.66553743000001},
  {lng: 1.99522652, lat: 47.66425524},
  {lng: 2.00051915, lat: 47.67366962000001},
  {lng: 2.0089118, lat: 47.67746215},
  {lng: 2.06464576, lat: 47.67486283},
  {lng: 2.0699302, lat: 47.68062234000001},
  {lng: 2.07454408, lat: 47.68215285},
  {lng: 2.10385297, lat: 47.67735849000002},
  {lng: 2.10774226, lat: 47.67106134},
  {lng: 2.11262037, lat: 47.67000055000001},
  {lng: 2.1279141, lat: 47.6782587},
  {lng: 2.13782652, lat: 47.67717882},
  {lng: 2.14919574, lat: 47.67074896},
  {lng: 2.16959468, lat: 47.67102298},
  {lng: 2.19881825, lat: 47.67743824},
  {lng: 2.20367766, lat: 47.67855019000001},
  {lng: 2.20608151, lat: 47.67639434},
  {lng: 2.20675114, lat: 47.66294078000001},
  {lng: 2.22050155, lat: 47.66480728000001},
  {lng: 2.2407022, lat: 47.64126104},
  {lng: 2.23976168, lat: 47.62436903},
  {lng: 2.23920916, lat: 47.62097771},
  {lng: 2.23395494, lat: 47.62067635},
  {lng: 2.19724625, lat: 47.60745224},
  {lng: 2.15629095, lat: 47.60104565},
  {lng: 2.13809145, lat: 47.58881045},
  {lng: 2.119568520000001, lat: 47.58294881},
  {lng: 2.12146966, lat: 47.57964238},
  {lng: 2.12770246, lat: 47.56993073},
  {lng: 2.12519018, lat: 47.55635249000001},
  {lng: 2.13137996, lat: 47.55069884000001},
  {lng: 2.19377296, lat: 47.54857015000001},
  {lng: 2.19756701, lat: 47.54611925},
  {lng: 2.21449771, lat: 47.52042272},
  {lng: 2.19606087, lat: 47.48790374},
  {lng: 2.20131377, lat: 47.48818885},
  {lng: 2.21942609, lat: 47.49544048000001},
  {lng: 2.23499234, lat: 47.49635472},
  {lng: 2.24308144, lat: 47.49276366},
  {lng: 2.24774007, lat: 47.49173295000001},
  {lng: 2.24306757, lat: 47.48559480000001},
  {lng: 2.23821535, lat: 47.46894133},
  {lng: 2.24499625, lat: 47.45994395000001},
  {lng: 2.23864655, lat: 47.45096991},
  {lng: 2.24669853, lat: 47.44239531},
  {lng: 2.24369607, lat: 47.41482237},
  {lng: 2.24038643, lat: 47.41298556},
  {lng: 2.23039252, lat: 47.40752577},
  {lng: 2.22518523, lat: 47.40752984},
  {lng: 2.20483667, lat: 47.40608714},
  {lng: 2.18824479, lat: 47.43570559000001},
  {lng: 2.13669234, lat: 47.40632197000001},
  {lng: 2.11499222, lat: 47.42148402},
  {lng: 2.11562994, lat: 47.4179232},
  {lng: 2.116918350000001, lat: 47.41080156},
  {lng: 2.10274467, lat: 47.39161413},
  {lng: 2.09708096, lat: 47.36680368},
  {lng: 2.10187013, lat: 47.36764917000001},
  {lng: 2.1113819, lat: 47.36953015},
  {lng: 2.11466283, lat: 47.36701784000002},
  {lng: 2.12670378, lat: 47.3454158},
  {lng: 2.11939416, lat: 47.33342951},
  {lng: 2.12852119, lat: 47.33111655},
  {lng: 2.13501217, lat: 47.32173695},
  {lng: 2.14799548, lat: 47.31636172000001},
  {lng: 2.15715042, lat: 47.30021164000001},
  {lng: 2.15342941, lat: 47.29787596000001},
  {lng: 2.1399174, lat: 47.29343782},
  {lng: 2.13289184, lat: 47.28119089000001},
  {lng: 2.12836175, lat: 47.28017529},
  {lng: 2.11426169, lat: 47.27917652},
  {lng: 2.11113135, lat: 47.28173504},
  {lng: 2.10393608, lat: 47.28571563},
  {lng: 2.09420768, lat: 47.28538882},
  {lng: 2.0889708, lat: 47.28549463},
  {lng: 2.05892343, lat: 47.28037966000001},
  {lng: 2.02452648, lat: 47.26511618},
  {lng: 2.02025878, lat: 47.26700261},
  {lng: 2.01045756, lat: 47.26841457},
  {lng: 1.99661123, lat: 47.26574785},
  {lng: 1.97595444, lat: 47.27576910000001},
  {lng: 1.97582136, lat: 47.27590362},
  {lng: 1.97143436, lat: 47.27765383},
  {lng: 1.94136394, lat: 47.29006659000001},
  {lng: 1.92300837, lat: 47.27359431000001},
  {lng: 1.92268729, lat: 47.26385991},
  {lng: 1.89550019, lat: 47.25479944},
  {lng: 1.89350291, lat: 47.25187718000002},
  {lng: 1.89610817, lat: 47.24675963},
  {lng: 1.90952735, lat: 47.24378759},
  {lng: 1.91224619, lat: 47.24075709000001},
  {lng: 1.91563983, lat: 47.23418468},
  {lng: 1.90832382, lat: 47.22088902},
  {lng: 1.90585245, lat: 47.21788422},
  {lng: 1.87534026, lat: 47.20707908},
  {lng: 1.85309421, lat: 47.22053553},
  {lng: 1.83908293, lat: 47.21930643},
  {lng: 1.83451591, lat: 47.22055502000001},
  {lng: 1.81461766, lat: 47.22999315000001},
  {lng: 1.81151897, lat: 47.23219204000001},
  {lng: 1.79582496, lat: 47.2378228},
  {lng: 1.79357053, lat: 47.23480761},
  {lng: 1.78601124, lat: 47.23139832},
  {lng: 1.77610626, lat: 47.23138656},
  {lng: 1.77246282, lat: 47.23373469},
  {lng: 1.75004617, lat: 47.24731442000001},
  {lng: 1.74668753, lat: 47.24987008},
  {lng: 1.71581654, lat: 47.27682129},
  {lng: 1.71294334, lat: 47.27395414},
  {lng: 1.70042504, lat: 47.26408039},
  {lng: 1.66569506, lat: 47.25889093},
  {lng: 1.65113525, lat: 47.26184592},
  {lng: 1.6494652, lat: 47.27148851000001},
  {lng: 1.62957443, lat: 47.27443591000001},
  {lng: 1.61979115, lat: 47.27263035},
  {lng: 1.61209042, lat: 47.27714314},
  {lng: 1.60764607, lat: 47.27542393},
  {lng: 1.6027214, lat: 47.27501489},
  {lng: 1.59313362, lat: 47.27441376},
  {lng: 1.59289038, lat: 47.25769782},
  {lng: 1.58781381, lat: 47.25788088},
  {lng: 1.56307814, lat: 47.26142489},
  {lng: 1.52395106, lat: 47.25534358000002},
  {lng: 1.52675575, lat: 47.25249448},
  {lng: 1.52700237, lat: 47.23978394},
  {lng: 1.53271848, lat: 47.23026113},
  {lng: 1.53444416, lat: 47.22359807},
  {lng: 1.52806433, lat: 47.21925337},
  {lng: 1.5266418, lat: 47.22250986000001},
  {lng: 1.50350441, lat: 47.23452479},
  {lng: 1.49483563, lat: 47.23312141},
  {lng: 1.48760795, lat: 47.23747651000001},
  {lng: 1.47301413, lat: 47.23891547},
  {lng: 1.4679941, lat: 47.2390307},
  {lng: 1.45314765, lat: 47.23898989},
  {lng: 1.42120426, lat: 47.22915981},
  {lng: 1.41830886, lat: 47.22618603},
  {lng: 1.40958761, lat: 47.21741688000001},
  {lng: 1.40637195, lat: 47.21554674000001},
  {lng: 1.39283913, lat: 47.20868952},
  {lng: 1.38842363, lat: 47.20687202000001},
  {lng: 1.35185671, lat: 47.19389849},
  {lng: 1.33677829, lat: 47.19421846},
  {lng: 1.32666077, lat: 47.18622236},
  {lng: 1.32376882, lat: 47.19120800000001},
  {lng: 1.32202901, lat: 47.19387363},
  {lng: 1.30451841, lat: 47.21696491},
  {lng: 1.30278253, lat: 47.22001712},
  {lng: 1.30168767, lat: 47.22337195000001},
  {lng: 1.28797848, lat: 47.24097996},
  {lng: 1.27499997, lat: 47.25593912},
  {lng: 1.26495846, lat: 47.25727671},
  {lng: 1.2421551, lat: 47.27573009},
  {lng: 1.24329305, lat: 47.27825985000001},
  {lng: 1.24364529, lat: 47.28366097},
  {lng: 1.24256654, lat: 47.28662943},
  {lng: 1.22333091, lat: 47.29417247},
  {lng: 1.21934918, lat: 47.29361222},
  {lng: 1.21570011, lat: 47.29238933},
  {lng: 1.21528003, lat: 47.28902962},
  {lng: 1.19723765, lat: 47.28441775000001},
  {lng: 1.18243258, lat: 47.28491752},
  {lng: 1.17412885, lat: 47.28860459000001},
  {lng: 1.17337523, lat: 47.28556521},
  {lng: 1.16206063, lat: 47.27219886},
  {lng: 1.13122139, lat: 47.29454306},
  {lng: 1.10812351, lat: 47.29840202},
  {lng: 1.10598661, lat: 47.30160900000001},
  {lng: 1.09485991, lat: 47.32853327},
  {lng: 1.10631308, lat: 47.33108483000001},
  {lng: 1.10724253, lat: 47.33439640000001},
  {lng: 1.11578959, lat: 47.35010468000001},
  {lng: 1.12241454, lat: 47.35506845},
  {lng: 1.10688532, lat: 47.36714826000001},
  {lng: 1.10740204, lat: 47.37288439},
  {lng: 1.1185114, lat: 47.38165632},
  {lng: 1.12185672, lat: 47.38365268},
  {lng: 1.12169048, lat: 47.39037110000001},
  {lng: 1.11339735, lat: 47.39847023},
  {lng: 1.1105271, lat: 47.4086325},
  {lng: 1.08501332, lat: 47.42968024},
  {lng: 1.1147593, lat: 47.42924237},
  {lng: 1.13191347, lat: 47.44568696},
  {lng: 1.13336482, lat: 47.44894959000001},
  {lng: 1.12885623, lat: 47.45009913000001},
  {lng: 1.11288329, lat: 47.46591729},
  {lng: 1.10771469, lat: 47.46511591},
  {lng: 1.08711029, lat: 47.46181796},
  {lng: 1.09373976, lat: 47.47048135},
  {lng: 1.09028798, lat: 47.47284619},
  {lng: 1.08158044, lat: 47.48820725},
  {lng: 1.08028016, lat: 47.49156663},
  {lng: 1.06885902, lat: 47.50299303000001},
  {lng: 1.06882517, lat: 47.51946411000001},
  {lng: 1.04502626, lat: 47.5315708},
  {lng: 1.04755464, lat: 47.53686059000001},
  {lng: 1.04963382, lat: 47.53987118},
  {lng: 1.07517256, lat: 47.55975339},
  {lng: 1.0769995, lat: 47.57244812},
  {lng: 1.07317442, lat: 47.57119214000001},
  {lng: 1.06359183, lat: 47.56613981},
  {lng: 1.0621014, lat: 47.56954182},
  {lng: 1.05990087, lat: 47.57648838},
  {lng: 1.03334908, lat: 47.60700522},
  {lng: 1.02890962, lat: 47.60849268},
  {lng: 1.01928575, lat: 47.60768228},
  {lng: 1.01253079, lat: 47.60278381000001},
  {lng: 1.00372249, lat: 47.58435882000001},
  {lng: 1.00039541, lat: 47.58395175},
  {lng: 0.99701786, lat: 47.58396681000001},
  {lng: 0.99559367, lat: 47.58718884000001},
  {lng: 0.98766098, lat: 47.59116303},
  {lng: 0.98490725, lat: 47.60432772},
  {lng: 0.9917842900000002, lat: 47.62002400000001},
  {lng: 0.98704823, lat: 47.62052682},
  {lng: 0.9727804100000002, lat: 47.62174554},
  {lng: 0.9652605, lat: 47.62956421},
  {lng: 0.9609237500000002, lat: 47.6279657},
  {lng: 0.9516429300000001, lat: 47.62614628},
  {lng: 0.9373435000000001, lat: 47.6284218},
  {lng: 0.93259825, lat: 47.62876937},
  {lng: 0.91959718, lat: 47.6327496},
  {lng: 0.91675597, lat: 47.63000721},
  {lng: 0.9040799600000001, lat: 47.61596214000001},
  {lng: 0.89528855, lat: 47.61292076},
  {lng: 0.8991563, lat: 47.60371195},
  {lng: 0.86458191, lat: 47.60003138},
  {lng: 0.8576378000000001, lat: 47.61202383},
  {lng: 0.85274323, lat: 47.61288979},
  {lng: 0.8507701300000001, lat: 47.62307404},
  {lng: 0.8593453800000002, lat: 47.62668278},
  {lng: 0.8622926800000001, lat: 47.63316124000001},
  {lng: 0.84469586, lat: 47.64509906000001},
  {lng: 0.86054472, lat: 47.67353901},
  {lng: 0.8620115, lat: 47.67683204},
  {lng: 0.8596062800000002, lat: 47.67950023000001},
  {lng: 0.86740515, lat: 47.68648065},
  {lng: 0.86530109, lat: 47.68933265},
  {lng: 0.84428655, lat: 47.68186846},
  {lng: 0.8409268600000002, lat: 47.68012513},
  {lng: 0.83417203, lat: 47.67692646},
  {lng: 0.829341, lat: 47.67673712000001},
  {lng: 0.8117747600000002, lat: 47.68221147},
  {lng: 0.8025847600000001, lat: 47.67939191},
  {lng: 0.7871710500000001, lat: 47.68082486000002},
  {lng: 0.73564115, lat: 47.69553705},
  {lng: 0.73259734, lat: 47.69308424000001},
  {lng: 0.71940731, lat: 47.68999597000001},
  {lng: 0.71214368, lat: 47.6818074},
  {lng: 0.70731248, lat: 47.68296329},
  {lng: 0.67477124, lat: 47.69900171},
  {lng: 0.67259004, lat: 47.6958939},
  {lng: 0.65425324, lat: 47.68417820000001},
  {lng: 0.64922479, lat: 47.68436626},
  {lng: 0.6455105799999999, lat: 47.68929619000001},
  {lng: 0.65194769, lat: 47.69846662},
  {lng: 0.63876601, lat: 47.70811674},
  {lng: 0.6287861, lat: 47.7080247},
  {lng: 0.61442703, lat: 47.69421095},
  {lng: 0.6112056700000002, lat: 47.69165329},
  {lng: 0.6045328, lat: 47.68667819},
  {lng: 0.59589509, lat: 47.68924814},
  {lng: 0.59279207, lat: 47.70217423},
  {lng: 0.58031357, lat: 47.71236909},
  {lng: 0.58049855, lat: 47.71282080000001},
  {lng: 0.59407918, lat: 47.72302859},
  {lng: 0.60872419, lat: 47.72528897000002},
  {lng: 0.6115916, lat: 47.72812926000001},
  {lng: 0.61066462, lat: 47.73202880000001},
  {lng: 0.61794279, lat: 47.73662546},
  {lng: 0.61990086, lat: 47.74616307000001},
  {lng: 0.6263357000000001, lat: 47.75134943000001},
  {lng: 0.64609004, lat: 47.75305014},
  {lng: 0.65027255, lat: 47.75491803000001},
  {lng: 0.65120017, lat: 47.75511227},
  {lng: 0.67096041, lat: 47.76729787},
  {lng: 0.67498392, lat: 47.76876764000001},
  {lng: 0.6924411200000001, lat: 47.76433752},
  {lng: 0.69734253, lat: 47.76418169000001},
  {lng: 0.70263038, lat: 47.76966235},
  {lng: 0.69173852, lat: 47.78352432000001},
  {lng: 0.7026811300000001, lat: 47.7896423},
  {lng: 0.71189959, lat: 47.78720741},
  {lng: 0.71281215, lat: 47.79048551},
  {lng: 0.73011282, lat: 47.80545978000001},
  {lng: 0.73378404, lat: 47.80768719000001},
  {lng: 0.7402737, lat: 47.81255275000001},
  {lng: 0.74769394, lat: 47.82782919000001},
  {lng: 0.7563275200000001, lat: 47.83081505},
  {lng: 0.75898367, lat: 47.83357746},
  {lng: 0.76840883, lat: 47.83109592},
  {lng: 0.7740329600000001, lat: 47.84058934},
  {lng: 0.77384276, lat: 47.85064337},
  {lng: 0.77009218, lat: 47.85274293},
  {lng: 0.7591542100000001, lat: 47.85921602000001},
  {lng: 0.763389, lat: 47.86512898},
  {lng: 0.7572747000000001, lat: 47.88812771},
  {lng: 0.75979935, lat: 47.89808327000001},
  {lng: 0.76372911, lat: 47.89997122},
  {lng: 0.76806106, lat: 47.90138769000001},
  {lng: 0.7869914, lat: 47.91174154},
  {lng: 0.7940635500000001, lat: 47.90743665000001},
  {lng: 0.7978566700000001, lat: 47.89796114},
  {lng: 0.8132289000000001, lat: 47.8894826},
  {lng: 0.81682588, lat: 47.89182315000001},
  {lng: 0.81580714, lat: 47.89515597},
  {lng: 0.81053437, lat: 47.90822772},
  {lng: 0.81222036, lat: 47.92814697},
  {lng: 0.81633998, lat: 47.93427202},
  {lng: 0.84519078, lat: 47.94118272},
  {lng: 0.8483664400000001, lat: 47.94392155},
  {lng: 0.84556654, lat: 47.95389677},
  {lng: 0.8428256, lat: 47.95659611},
  {lng: 0.83683768, lat: 47.96893184},
  {lng: 0.82903265, lat: 47.97256420000001},
  {lng: 0.82434968, lat: 47.98173204},
  {lng: 0.8194754400000001, lat: 47.98724546},
  {lng: 0.8323378100000001, lat: 48.00039033},
  {lng: 0.8357623, lat: 48.00913174000001},
  {lng: 0.8405875, lat: 48.01900619},
  {lng: 0.8383238000000001, lat: 48.03261328},
  {lng: 0.81333521, lat: 48.03144459},
  {lng: 0.80711168, lat: 48.03658011},
  {lng: 0.79754405, lat: 48.03723728},
  {lng: 0.7966986600000002, lat: 48.06661894000001},
  {lng: 0.7939861700000002, lat: 48.06943438},
  {lng: 0.8383634, lat: 48.07130428},
  {lng: 0.8430091, lat: 48.07263261000001},
  {lng: 0.8450018, lat: 48.09276825},
  {lng: 0.8302812200000002, lat: 48.09113206},
  {lng: 0.8161384, lat: 48.09461902},
  {lng: 0.81790296, lat: 48.09767371},
  {lng: 0.8372248500000002, lat: 48.10091637000001},
  {lng: 0.84120563, lat: 48.10305375000001},
  {lng: 0.8717369800000001, lat: 48.10845754},
  {lng: 0.8838076, lat: 48.1031755},
  {lng: 0.88889498, lat: 48.1022581},
  {lng: 0.9132812300000002, lat: 48.10414846},
  {lng: 0.92920556, lat: 48.11170635},
  {lng: 0.93906016, lat: 48.11230982},
  {lng: 0.94401412, lat: 48.11236874},
  {lng: 0.94557969, lat: 48.10090259},
  {lng: 0.9454038200000001, lat: 48.09790565},
  {lng: 0.95507012, lat: 48.10047516},
  {lng: 0.9952184800000002, lat: 48.12668032},
  {lng: 1.00891434, lat: 48.13170146},
  {lng: 1.02958869, lat: 48.13282389},
  {lng: 1.03976233, lat: 48.13104009},
  {lng: 1.04707257, lat: 48.12164091},
  {lng: 1.04013377, lat: 48.11651921000001},
  {lng: 0.99451097, lat: 48.09913447},
  {lng: 0.99568978, lat: 48.08928210000001},
  {lng: 1.00940223, lat: 48.08415894},
  {lng: 1.02934436, lat: 48.08753072},
  {lng: 1.03391206, lat: 48.0857469},
  {lng: 1.06504363, lat: 48.08560304},
  {lng: 1.07187364, lat: 48.07669251},
  {lng: 1.10753793, lat: 48.08098400000001},
  {lng: 1.1127497, lat: 48.08079571},
  {lng: 1.10687821, lat: 48.06096678},
  {lng: 1.11321722, lat: 48.05548327000001},
  {lng: 1.11575576, lat: 48.05245287},
  {lng: 1.11758855, lat: 48.04281294000001},
  {lng: 1.12013363, lat: 48.04004242000001},
  {lng: 1.12903135, lat: 48.03449555000001},
  {lng: 1.1332806, lat: 48.03397269},
  {lng: 1.14115001, lat: 48.03109351},
  {lng: 1.14392539, lat: 48.02873043000001},
  {lng: 1.1636002, lat: 48.02853345},
  {lng: 1.16710798, lat: 48.02622212},
  {lng: 1.1618646, lat: 48.0178587},
  {lng: 1.17003083, lat: 48.00992709},
  {lng: 1.16955311, lat: 48.00668463},
  {lng: 1.17414117, lat: 48.00520137000001},
  {lng: 1.18772494, lat: 48.00059587},
  {lng: 1.19999924, lat: 47.97569539},
  {lng: 1.19590585, lat: 47.97365894},
  {lng: 1.19148264, lat: 47.97196087},
  {lng: 1.2052017, lat: 47.96863089},
  {lng: 1.22266464, lat: 47.97563461000001},
  {lng: 1.24280719, lat: 47.97831592000001},
  {lng: 1.24799905, lat: 47.97857120000001},
  {lng: 1.2590533, lat: 47.9718384},
  {lng: 1.26059414, lat: 47.96852404000001}
]

