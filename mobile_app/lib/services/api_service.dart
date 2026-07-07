import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'http://localhost:5000'; // Target NestJS backend

  static Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('Connection to backend failed, returning demo token: $e');
    }
    return null;
  }

  static Future<List<dynamic>> fetchCases(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/repair-cases'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('API Error: $e');
    }
    return [];
  }

  static Future<Map<String, dynamic>?> submitDiagnosis(String token, String symptom, String model) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/diagnosis/symptom'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'symptom': symptom, 'modelName': model}),
      );
      if (response.statusCode == 201 || response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      print('API Error: $e');
    }
    return null;
  }
}
